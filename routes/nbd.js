const Router = require("koa-router");
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

const nbdRouter = new Router();

const routerInfo = {
  name: "nbd",
  title: "每日经济新闻",
  subtitle: "点击排行",
};

const cacheKey = "nbdData";
const url = "https://www.nbd.com.cn/";

let updateTime = new Date().toISOString();

const getDataFromHtml = (html) => {
  const $ = cheerio.load(html);
  const hotList = [];

  $('div.rank-wrapper ul.rank-list li').each((i, el) => {
    const title = $(el).find('a').attr('title').trim();
    const articleUrl = $(el).find('a').attr('href');
    const fullUrl = "https://www.nbd.com.cn" + articleUrl;

    hotList.push({
      title,
      url: fullUrl,
      mobileUrl: fullUrl,
    });
  });

  return hotList;
};

nbdRouter.get("/nbd", async (ctx) => {
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";

    if (!data) {
      const response = await axios.get(url);
      data = getDataFromHtml(response.data);
      await set(cacheKey, data);
      updateTime = new Date().toISOString();
    }

    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from,
      updateTime,
      data
    };
  } catch (error) {
    console.error(error);

    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        from: "cache",
        updateTime,
        data: cachedData
      };
    } else {
      ctx.body = {
        code: 500,
        ...routerInfo,
        message: "获取失败",
      };
    }
  }
});

nbdRouter.get("/nbd/new", async (ctx) => {
  try {
    const response = await axios.get(url);
    const newData = getDataFromHtml(response.data);
    updateTime = new Date().toISOString();

    await del(cacheKey);
    await set(cacheKey, newData);

    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from: "server",
      updateTime,
      data: newData
    };
  } catch (error) {
    console.error(error);

    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        from: "cache",
        updateTime,
        data: cachedData
      };
    } else {
      ctx.body = {
        code: 500,
        ...routerInfo,
        message: "获取失败",
      };
    }
  }
});

module.exports = nbdRouter;
