const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const xueqiuRouter = new Router();

const routerInfo = {
  name: "xueqiu",
  title: "雪球",
  subtitle: "热门财经新闻",
};

const cacheKey = "xueqiuData";
const url = "https://xueqiu.com/query/v1/status/hots.json?count=50&scope=day&type=news";

const headers = {
  Cookie: "xq_a_token=29bdb37dee2432c294425cc9e8f45710a62643a5",
};

let updateTime = new Date().toISOString();

const getDataFromApi = async () => {
  try {
    const response = await axios.get(url, { headers });

    return response.data.data.map((item) => ({
      title: item.title,
      url: item.target,
      mobileUrl: item.target,
      hot: item.hot,
      image: item.pic,
    }));
  } catch (error) {
    throw error;
  }
};

xueqiuRouter.get("/xueqiu", async (ctx) => {
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
      data,
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

xueqiuRouter.get("/xueqiu/new", async (ctx) => {
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
      data: newData,
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

module.exports = xueqiuRouter;
