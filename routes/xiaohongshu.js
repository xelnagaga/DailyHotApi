const axios = require("axios");
const Router = require("koa-router");
const { get, set, del } = require("../utils/cacheData");  // Assuming you have a similar caching mechanism for data persistence

const xhsRouter = new Router();

const url = "https://api-service.chanxiaohong.com/v1/noteRankList?sort_column=interact&rank_type=1&second=172800&label=&sub_label=&type=&page=1&size=50";

const routerInfo = {
  name: "xiaohongshu",
  title: "小红书互动榜",
  subtitle: "互动榜",
};

let updateTime = new Date().toISOString();

const getData = (dataList) => {
  if (!dataList) return [];
  return dataList.map((item) => {
    return {
      title: item.title,
      hot: item.interact,
      url: `https://www.xiaohongshu.com/explore/${item.note_id}`,
      mobileUrl: `https://www.xiaohongshu.com/discovery/item/${item.note_id}`,
      // You can add more fields here if needed
    };
  });
};

xhsRouter.get("/xiaohongshu", async (ctx) => {
  try {
    let data = await get("xhsData");  // Cache key
    const from = data ? "cache" : "server";
    if (!data) {
      const response = await axios.get(url);
      data = getData(response.data.data.list);
      updateTime = new Date().toISOString();
      await set("xhsData", data);  // Cache the processed data
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
    ctx.body = {
      code: 500,
      ...routerInfo,
      message: "获取失败",
    };
  }
});

xhsRouter.get("/xiaohongshu/new", async (ctx) => {
  try {
    const response = await axios.get(url);
    const newData = getData(response.data.data.list);
    updateTime = new Date().toISOString();
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      total: newData.length,
      updateTime,
      data: newData,
    };
    await del("xhsData");
    await set("xhsData", newData);
  } catch (error) {
    const cachedData = await get("xhsData");
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

module.exports = xhsRouter;
