const Router = require("koa-router");
const axios = require("axios");
const vm = require('vm');
const { get, set, del } = require("../utils/cacheData");

const bokerankRouter = new Router();

const routerInfo = {
  name: "bokerank",
  title: "播客排行",
  subtitle: "每日热门播客",
};

const cacheKey = "bokerankData";

let updateTime = new Date().toISOString();

const getURLFromJS = async (jsURL) => {
  try {
    const response = await axios.get(jsURL);
    const script = new vm.Script(response.data);
    const context = vm.createContext();
    script.runInContext(context);
    return context.mI; // Assuming the URL is stored in a variable named 'mI'
  } catch (error) {
    console.error(error);
  }
};

const jsURL = 'https://xyzrank.justinbot.com/assets/index.46d6650f.js';

const getDataFromJson = (json) => {
  const podcastList = [];
  
  json.data.episodes.forEach((item) => {
    const title = `${item.podcastName}:${item.title}`;
    const url = item.link;
    const hot = item.playCount;

    podcastList.push({
      title,
      url,
      mobileUrl: url,
      hot
    });
  });
  
  return podcastList;
};

bokerankRouter.get("/bokerank", async (ctx) => {
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    
    if (!data) {
      const url = await getURLFromJS(jsURL);
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

bokerankRouter.get("/bokerank/new", async (ctx) => {
  try {
    const url = await getURLFromJS(jsURL);
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

module.exports = bokerankRouter;