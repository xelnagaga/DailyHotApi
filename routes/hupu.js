const Router = require("koa-router");
const axios = require("axios");
const cheerio = require('cheerio');
const { get, set, del } = require("../utils/cacheData");

const hupuRouter = new Router();

const routerInfo = {
  name: "hupu",
  title: "虎扑",
  subtitle: "热门帖子",
};

const cacheKey = "hupuData";
const url = "https://bbs.hupu.com/topic-daily-hot";

let updateTime = new Date().toISOString();

const getDataFromApi = async () => {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
  
    const posts = [];
  
    $('li.bbs-sl-web-post-body').each((index, element) => {
      const titleElement = $(element).find('.post-title a');
      const title = titleElement.text();
      const url = 'https://bbs.hupu.com' + titleElement.attr('href');
      const datum = $(element).find('.post-datum').text();
      const auth = $(element).find('.post-auth a').text();
      const time = $(element).find('.post-time').text();
  
      posts.push({
        title,
        url,
        datum,
        auth,
        time
      });
    });
  
    return posts;
  };

hupuRouter.get("/hupu", async (ctx) => {
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    
    if (!data) {
      data = await getDataFromApi();
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

hupuRouter.get("/hupu/new", async (ctx) => {
  try {
    const newData = await getDataFromApi();
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

module.exports = hupuRouter;