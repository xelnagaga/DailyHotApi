const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const sougouRouter = new Router();

const routerInfo = {
  name: "sougou",
  title: "搜狗热搜榜",
  subtitle: "热搜榜",
};

const cacheKey = "sougouData";

let updateTime = new Date().toISOString();

const getSougouData = async () => {
  const timestamp = Date.now();
  const url = `https://go.ie.sogou.com/hot_ranks?callback=jQuery112401920502532612709_${timestamp}&h=0&r=0&v=0&_=${timestamp + 1}`;
  const response = await axios.get(url);
  
  // Extracting data from JSONP response
  const dataStr = response.data.slice(response.data.indexOf('{'), response.data.lastIndexOf('}') + 1);
  const parsedData = JSON.parse(dataStr);
  
  return parsedData.data.map(item => ({
    title: item.attributes.title,
    flag: item.attributes.flag,
    //num: item.attributes.num,
    rank: item.attributes.rank,
    url: `https://www.sogou.com/sie?&query=${encodeURIComponent(item.attributes.title)}`,
    mobileUrl: `https://www.sogou.com/sie?&query=${encodeURIComponent(item.attributes.title)}`,
    hot: item.attributes.num
}));

};

sougouRouter.get("/sougou", async (ctx) => {
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    
    if (!data) {
      data = await getSougouData();
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

sougouRouter.get("/sougou/new", async (ctx) => {
  try {
    const newData = await getSougouData();
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

module.exports = sougouRouter;
