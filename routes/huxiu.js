const Router = require("koa-router");
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

const huxiuRouter = new Router();

const routerInfo = {
  name: "huxiu",
  title: "虎嗅网",
  subtitle: "热榜",
};

const cacheKey = "huxiuData";
const url = "https://www.huxiu.com/article/";

let updateTime = new Date().toISOString();

const getDataFromHtml = (html) => {
  const $ = cheerio.load(html);
  const hotList = [];

  $('div.article-item-wrap').each((i, el) => {
    const title = $(el).find('h3.title').text().trim();
    const articleUrl = $(el).find('a.tibt-card__bottom__title-wrap').attr('href');
    const fullUrl = "https://www.huxiu.com" + articleUrl;

    hotList.push({
      title,
      url: fullUrl,
      mobileUrl: fullUrl,
    });
  });

  return hotList;
};

huxiuRouter.get("/huxiu", async (ctx) => {
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

huxiuRouter.get("/huxiu/new", async (ctx) => {
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

module.exports = huxiuRouter;
