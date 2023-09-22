const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const sinafinRouter = new Router();

const routerInfo = {
  name: "sinafin",
  title: "新浪财经",
  subtitle: "热榜",
};

const cacheKey = "sinafinData";
const url = "https://top.finance.sina.com.cn/ws/GetTopDataList.php?top_not_url=/ustock/&top_type=day&top_cat=finance_stock_conten_suda&top_time=20230920&top_show_num=50&top_order=DESC&get_new=1&js_var=stock_1_data";

let updateTime = new Date().toISOString();

const getDataFromApi = async () => {
    const response = await axios.get(url);
    const match = /var stock_1_data = (\{.*\});/.exec(response.data);
    if (match && match[1]) {
      const parsedData = JSON.parse(match[1]);
      return parsedData.data.map(item => ({ 
        title: item.title,
        url: item.url,
        mobileUrl: item.url,
        hot: item.top_num
      }));
    } else {
      throw new Error("Failed to parse data from API response.");
    }
  };
  

sinafinRouter.get("/sinafin", async (ctx) => {
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

sinafinRouter.get("/sinafin/new", async (ctx) => {
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

module.exports = sinafinRouter;
