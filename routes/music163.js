const Router = require("koa-router");
const music163Router = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 接口信息
const routerInfo = {
  name: "music163",
  title: "网易云音乐",
  subtitle: "热歌榜",
};

// 缓存键名
const cacheKey = "music163Data";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://music.163.com/discover/toplist?id=3778678";

// 数据处理
const getData = (data) => {
  const regex = /<a href="\/song\?id=(\d+)">(.+?)<\/a>/g;
  let match;
  const songs = [];
  while (match = regex.exec(data)) {
    songs.push({
      title: match[2],
      url: `https://music.163.com/#/song?id=${match[1]}`,
      mobileUrl: `https://music.163.com/song?id=${match[1]}`
    });
  }
  return songs;
};

// 请求头
const headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    "Cookie": {
        "NMTID": "00OXgsVmgJTWUkHCkBtpr44yvrkk9gAAAGKqRwpIg",
        "JSESSIONID-WYYY": "kEqIlMSvjlGcc8sC74Dsgal3M%2B151XBXFwCuSCj0YfoKfHca5%2B0sasu7vTVuIKzN5PJ8dodDK9YttffHmsvKdk6Xqiw8%2Fk3r29droXBkrrY2Er%2FJF5Ylcs%2BGsvlARd7Ak24vxFBU47tMSk%2BMSaf3G%2BUNnHlubFO1Mc9NRtAmYzfASTxq%3A1695056109848",
        "_iuqxldmzr_": "32",
        "_ntes_nnid": "6eeba7afb3d3ce8529f77390fb3f7161,1695054309897",
        "_ntes_nuid": "6eeba7afb3d3ce8529f77390fb3f7161",
        "WEVNSM": "1.0.0",
        "WNMCID": "lzvhgu.1695054311350.01.0",
        "ntes_utid": "tid._.PFcgIP8QT91AB0QUAQeB3NnWUrAKJhWy._.0",
        "sDeviceId": "YD-d2ToBN2LDJNBFlQVRBPQzJyCAqQLZhcQ",
        "WM_NI": "5iSgYB%2B7x6r5g6REMfXxW1Pb%2FMezsQuNBV6GtJQEKq0EW74G7PBe9wGUPzr9bfLth23rV7fcZ4s3Hy7OKgqwj0GhIoawyF3HQwPD9oRGkBe0V7NtCmCANNbqbtRoH61aUVI%3D",
        "WM_NIKE": "9ca17ae2e6ffcda170e2e6eeb1b52185b9ae90d85e9bb88ab3d45e928a8f82c5728fb78ca6f85a9087a1b1d12af0fea7c3b92af7b79d88dc4ae9e9b8d7f13fa5ea9ea6d06e9ca899d2d36aed93ab9bf25bb7928eb7b54db8969fa6ca7bf49b99d8b74df5908e86bc7d858ba09bf133a2ba8495eb3af1ae9ad8e5699aecbdd4cb73f5918588f47daaf08989cc65a3a9b7a7b24493a9a0a5bc659299a5a3e83c96e98295c267819f82afe17ba2ac9e90cb3ef3bf9bb7cc37e2a3",
        "WM_TID": "o6R1ZtWVdfNAUUFAQEbQjY3WQ%2BQeY5LV",
        "playerid": "45417199"
    },
    "Pragma": "no-cache",
    "Referer": "https://music.163.com/",
    "Sec-Ch-Ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "\"macOS\"",
    "Sec-Fetch-Dest": "iframe",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
};

// 网易云音乐热门歌曲
music163Router.get("/music163", async (ctx) => {
  console.log("获取网易云音乐热门歌曲");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      console.log("从服务端重新获取网易云音乐热门歌曲");
      const response = await axios.get(url, { headers });
      data = getData(response.data);
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

// 网易云音乐热门歌曲 - 获取最新数据
music163Router.get("/music163/new", async (ctx) => {
  console.log("获取网易云音乐热门歌曲 - 最新数据");
  try {
    const response = await axios.get(url, { headers });
    const newData = getData(response.data);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取网易云音乐热门歌曲");
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

music163Router.info = routerInfo;
module.exports = music163Router;
