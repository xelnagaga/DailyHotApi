const Router = require("koa-router");
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

const fenghuangRouter = new Router();

const routerInfo = {
  name: "fenghuang",
  title: "凤凰网",
  subtitle: "热榜",
};

const cacheKey = "fenghuangData";
const url = "https://ishare.ifeng.com/hotNewsRank"; // 替换为凤凰网的真实URL

let updateTime = new Date().toISOString();

const getDataFromHtml = (html) => {
  const $ = cheerio.load(html);
  const hotList = [];

  // Extract the JavaScript code containing the allData variable
  const scriptContent = $('script:not([src])').map((i, el) => $(el).html()).get().join(' ');

  // Use a regular expression to extract the JSON object assigned to allData
  const allDataMatch = scriptContent.match(/var allData = (.*?);/);
  if (allDataMatch && allDataMatch[1]) {
      const allData = JSON.parse(allDataMatch[1]);
      
      if (allData.content && allData.content.list) {
          allData.content.list.forEach(article => {
              hotList.push({
                  imageUrl: article.thumbnail,
                  title: article.title,
                  url: article.link.weburl,
                  mobileUrl:article.link.weburl

              });
          });
      }
  }

  return hotList;
};

fenghuangRouter.get("/fenghuang", async (ctx) => {
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

fenghuangRouter.get("/fenghuang/new", async (ctx) => {
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

module.exports = fenghuangRouter;
