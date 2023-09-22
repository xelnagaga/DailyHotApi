const Router = require("koa-router");
const wangyiRouter = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 接口信息
const routerInfo = {
  name: "wangyi",
  title: "网易",
  subtitle: "热榜",
};

// 缓存键名
const cacheKey = "wangyiData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://gwtest.m.163.com/nc-main/api/v1/hqc/no-repeat-hot-list";

// 数据处理
const getData = (data) => {
  if (!data || !data.items) return [];
  return data.items.map((item) => ({
    title: item.title, 
    url: `https://c.m.163.com/news/a/${item.contentId}.html`,
    mobileUrl: `https://c.m.163.com/news/a/${item.contentId}.html`,
    hot: item.hotValue,
  }));
};

// 网易新闻热榜
wangyiRouter.get("/wangyi", async (ctx) => {
  console.log("获取网易新闻热榜");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      console.log("从服务端重新获取网易新闻热榜");
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Origin": "https://wp.m.163.com",
          "Referer": "https://wp.m.163.com/",
        },
      });
      data = getData(response.data.data);
      updateTime = new Date().toISOString();
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      ...routerInfo,
      message: "获取失败",
    };
  }
});

// 网易新闻热榜 - 获取最新数据
wangyiRouter.get("/wangyi/new", async (ctx) => {
  console.log("获取网易新闻热榜 - 最新数据");
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://wp.m.163.com",
        "Referer": "https://wp.m.163.com/",
      },
    });
    const newData = getData(response.data.data);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取网易新闻热榜");
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      total: newData.length,
      updateTime,
      data: newData,
    };
    await del(cacheKey);
    await set(cacheKey, newData);
  } catch (error) {
    console.error(error);
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        total: cachedData.length,
        updateTime,
        data: cachedData,
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

wangyiRouter.info = routerInfo;
module.exports = wangyiRouter;
