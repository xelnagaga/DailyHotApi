const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const woshipmRouter = new Router();

const routerInfo = {
  name: "woshipm",
  title: "人人都是产品经理",
  subtitle: "热门文章",
};

const cacheKey = "woshipmData";
const url = "https://www.woshipm.com/api2/app/article/popular/daily";

let updateTime = new Date().toISOString();

const getDataFromJson = (json) => {
  const articleList = [];
  
  json.RESULT.forEach((item) => {
    const data = item.data;
    const title = data.articleTitle;
    const desc = data.articleSummary;
    const fullUrl = `https://www.woshipm.com/${data.type}/${data.id}.html`;

    articleList.push({
      title,
      url: fullUrl,
      mobileUrl: fullUrl,
      desc
    });
  });
  
  return articleList;
};

woshipmRouter.get("/woshipm", async (ctx) => {
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    
    if (!data) {
      const response = await axios.get(url);
      data = getDataFromJson(response.data);
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

woshipmRouter.get("/woshipm/new", async (ctx) => {
  try {
    const response = await axios.get(url);
    const newData = getDataFromJson(response.data);
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

module.exports = woshipmRouter;
