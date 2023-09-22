const Router = require("koa-router");
const piaofangRouter = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 接口信息
const routerInfo = {
  name: "piaofang",
  title: "票房排行榜",
  subtitle: "今日实时票房排行榜",
};

// 缓存键名
const cacheKey = "piaofangData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://ys.endata.cn/enlib-api/api/movie/getMovie_BoxOffice_Day_List.do";

const headers = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Connection": "keep-alive",
    "Content-Length": "219",
    "Content-Type": "application/x-www-form-urlencoded",
    "Cookie": "route=4e39643a15b7003e568cadd862137cf3",
    "Host": "ys.endata.cn",
    "Origin": "https://ys.endata.cn",
    "Referer": "https://ys.endata.cn/BoxOffice/Movie",
    "Sec-Ch-Ua": '"Brave";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "macOS",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Gpc": "1",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  };

// 获取当前日期
const currentDate = new Date().toISOString().slice(0, 10);



// 数据处理
const getData = (data) => {
  if (!data || !data.table1) return [];
  return data.table1.map((movie) => ({
    title: `${movie.MovieName} | ${movie.EnMovieName} 票房:${movie.BoxOffice}元`,
    url: `https://ys.endata.cn/Details/Movie?entId=${movie.EntMovieID}`,
    mobileUrl: `https://ys.endata.cn/Details/Movie?entId=${movie.EntMovieID}`,
    hot: movie.BoxOffice,
  }));
};

// 票房热门电影
piaofangRouter.get("/piaofang", async (ctx) => {
  console.log("获取票房热门电影");
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      console.log("从服务端重新获取票房热门电影");
      const params = {
        //r: Math.random(),
        datetype: "Day",
        date: currentDate,
        sdate: currentDate,
        edate: currentDate,
        bserviceprice: 1,
        columnslist: "100,102,103,119,105,107,109,106,112,129,142,143,163,164,165",
        pageindex: 1,
        pagesize: 40,
        order: 103,
        ordertype: "desc",
      };
      const response = await axios.post(url, params, {
        headers: headers
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

// 票房热门电影 - 获取最新数据
piaofangRouter.get("/piaofang/new", async (ctx) => {
  console.log("获取票房热门电影 - 最新数据");
  try {
    const params = {
      //r: Math.random(),
      datetype: "Day",
      date: currentDate,
      sdate: currentDate,
      edate: currentDate,
      bserviceprice: 1,
      columnslist: "100,102,103,119,105,107,109,106,112,129,142,143,163,164,165",
      pageindex: 1,
      pagesize: 40,
      order: 103,
      ordertype: "desc",
    };
    const response = await axios.post(url, params, {
        headers: headers
      });
    const newData = getData(response.data.data);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取票房热门电影");
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

piaofangRouter.info = routerInfo;
module.exports = piaofangRouter;
