const Router = require("koa-router");
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

const madmanRouter = new Router();

const routerInfo = {
  name: "madman",
  title: "广告狂人",
  subtitle: "文章列表",
};

const cacheKey = "madmanData";
const url = "https://www.mad-men.com/";

let updateTime = new Date().toISOString();

const getDataFromHtml = (html) => {
  const $ = cheerio.load(html);
  const articleList = [];
  
  $('.item .right-desc').each((i, el) => {
    const title = $(el).find('.title a').text().trim();
    const link = $(el).find('.title a').attr('href');
    const desc = $(el).find('.content').text().trim();
    const fullUrl = `https://www.mad-men.com${link}`;

    articleList.push({
      title,
      url: fullUrl,
      mobileUrl: fullUrl,
      desc
    });
  });
  
  return articleList;
};

madmanRouter.get("/madman", async (ctx) => {
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

madmanRouter.get("/madman/new", async (ctx) => {
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

module.exports = madmanRouter;
