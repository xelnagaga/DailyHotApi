const Router = require("koa-router");
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

const cnblogsRouter = new Router();

const routerInfo = {
  name: "cnblogs",
  title: "博客园",
  subtitle: "48小时阅读排行",
};

const cacheKey = "cnblogsData";
const url = "https://www.cnblogs.com/aggsite/topviews";

let updateTime = new Date().toISOString();

const getDataFromHtml = (html) => {
  const $ = cheerio.load(html);
  const hotList = [];

  $('article.post-item').each((i, el) => {
    const title = $(el).find('.post-item-title').text();
    const url = $(el).find('.post-item-title').attr('href');
    const hot = $(el).find('a.post-meta-item btn:nth-child(3) span').text();
    const desc = $(el).find('.post-item-summary').text().trim();

    hotList.push({
      title,
      url,
      mobileUrl: url,
      hot,
      desc
    });
  });

  return hotList;
};

cnblogsRouter.get("/cnblogs", async (ctx) => {
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

cnblogsRouter.get("/cnblogs/new", async (ctx) => {
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

module.exports = cnblogsRouter;
