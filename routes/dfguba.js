const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const dfgubaRouter = new Router();

const routerInfo = {
  name: "dfguba",
  title: "东方财富股吧",
  subtitle: "热榜",
};

const cacheKey = "dfgubaData";
const url = (date) => `https://top.finance.sina.com.cn/ws/GetTopDataList.php?top_not_url=/ustock/&top_type=day&top_cat=finance_stock_conten_suda&top_time=${date}&top_show_num=50&top_order=DESC&get_new=1&js_var=stock_1_data`;

let updateTime = new Date().toISOString();

const getDataFromApi = async () => {
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');  // 获取当前日期
  const response = await axios.get(url(currentDate));
  const match = /var stock_1_data = (\{.*\});/.exec(response.data);
  if (match && match[1]) {
    const parsedData = JSON.parse(match[1]);
    return parsedData.data.map(item => ({
      title: item.title,
      url: item.url,
      mobileUrl: item.url,
      hot: item.top_num,
      desc: item.description
    }));
  } else {
    throw new Error("Failed to parse data from API response.");
  }
};

dfgubaRouter.get("/dfguba", async (ctx) => {
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

dfgubaRouter.get("/dfguba/new", async (ctx) => {
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

module.exports = dfgubaRouter;
