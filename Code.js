// Cấu hình
const CONFIG = {
  TELEGRAM_BOT_TOKEN: '7784988616:AAEbCk6u5XF06sV5DbZnNH-nBCWFGos8Vk4',
  TELEGRAM_CHAT_ID: '1661694132',
  YOUTUBE_API_KEY: 'AIzaSyAE9bSRkxlAXExUg0iHgMzymdQAwVuZYhU'
};

// Cấu hình icon cho từng loại kênh
const CHANNEL_ICONS = {
  // Nhóm 1: Quảng cáo
  "Facebook Ads": "📢",
  "Tiktok Ads": "📢",
  "PPC Ads": "📢",
  "Display Ads": "📢",
  "Google Ads": "📢",
  
  // Nhóm 2: Marketing/SEO
  "Digital Marketing": "📈",
  "SEO": "📈",
  
  // Nhóm 3: Phân tích/Dữ liệu
  "Tracking": "📊",
  "Data Analysis": "📊",
  
  // Nhóm 4: Khác
  "AI": "🤖"
};

// Hàm lấy icon dựa trên loại kênh
function getChannelIcon(channelType) {
  return CHANNEL_ICONS[channelType] || "📺"; // Icon mặc định nếu không tìm thấy
}

// Hàm lấy loại kênh từ ID
function getChannelType(channelId) {
  const channel = CHANNELS.find(ch => ch.id === channelId);
  return channel ? channel.type : "Unknown";
}

// Danh sách kênh YouTube cần theo dõi (ID, loại kênh và từ khóa lọc tiêu đề)
// title: chứa các từ khóa cách nhau bằng dấu phẩy, để rỗng "" nếu muốn lấy tất cả video
const CHANNELS = [
  { id: "UCWquNQV8Y0_defMKnGKrFOQ", type: "SEO", title: "" },
  { id: "UC1I8fcAdjxy-YgChuzUIUPw", type: "SEO", title: "" },
  { id: "UCgl9rHdm9KojNRWs56QI_hg", type: "Google Ads", title: "" },
  { id: "UCjP4kqaIiSnxiLApPFrDOWA", type: "Display Ads", title: "" },
  { id: "UCTWH-WVfrorlwnF2fOjUqcw", type: "Tiktok Ads", title: "tiktok" },
  { id: "UCJ5UyIAa5nEGksjcdp43Ixw", type: "Tracking", title: "" },
  { id: "UCcBKibvrvNU6Zaf6UQoVUnA", type: "Data Analysis", title: "" },
  { id: "UCsifPO4MT6BdV19vYx3KJ0Q", type: "Google Ads", title: "" }, 
  { id: "UC0m81bQuthaQZmFbXEY9QSw", type: "AI", title: "" },
  { id: "UCctL30i8tVgSS9A37Q532eg", type: "AI", title: "" },
  { id: "UC5Dv8i_vH5M9rB3HOZDCkng", type: "Facebook Ads", title: "" },
  { id: "UCWqjZ2W4pOOErFealWwBSXA", type: "Facebook Ads", title: "" },
  { id: "UCNJ2hbCj5y7dYpMORqCXvmQ", type: "PPC Ads", title: "" },
  { id: "UCl-Zrl0QhF66lu1aGXaTbfw", type: "Digital Marketing", title: "" },
  { id: "UCPEZnYBqewx-h43B5tLymYw", type: "Digital Marketing", title: "" }, 
  { id: "UCVeuau7DLrg7zlAjxxDbdww", type: "Digital Marketing", title: "" },
  { id: "UClgihdkPzNDtuoQy4xDw5mA", type: "Tracking", title: "" },
];

// Hàm kiểm tra từ khóa trong tiêu đề video (không phân biệt chữ hoa/thường)
function checkTitleKeywords(videoTitle, keywordsString) {
  // Nếu không có từ khóa nào được chỉ định, trả về true (lấy tất cả)
  if (!keywordsString || keywordsString.trim() === "") {
    return { matched: true, matchedKeywords: [] };
  }
  
  // Tách chuỗi từ khóa thành mảng và loại bỏ khoảng trắng thừa
  const keywords = keywordsString.split(',')
    .map(keyword => keyword.trim().toLowerCase())
    .filter(keyword => keyword !== "");
  
  if (keywords.length === 0) {
    return { matched: true, matchedKeywords: [] };
  }
  
  // Chuyển tiêu đề video sang chữ thường để so sánh
  const lowerVideoTitle = videoTitle.toLowerCase();
  
  // Kiểm tra từng từ khóa
  const matchedKeywords = [];
  for (const keyword of keywords) {
    if (lowerVideoTitle.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }
  
  return {
    matched: matchedKeywords.length > 0,
    matchedKeywords: matchedKeywords
  };
}

// Hàm cập nhật thống kê từ khóa khớp
function updateKeywordStats(channelId, matchedKeywords, videoTitle) {
  try {
    const props = PropertiesService.getScriptProperties();
    let keywordStats = JSON.parse(props.getProperty('KEYWORD_STATS') || '{"keywords": {}, "channels": {}}');
    
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Cập nhật thống kê cho từng từ khóa khớp
    for (const keyword of matchedKeywords) {
      if (!keywordStats.keywords[keyword]) {
        keywordStats.keywords[keyword] = {
          count: 0,
          lastMatched: today,
          channels: [],
          lastVideoTitle: ""
        };
      }
      
      keywordStats.keywords[keyword].count++;
      keywordStats.keywords[keyword].lastMatched = today;
      keywordStats.keywords[keyword].lastVideoTitle = videoTitle;
      
      if (!keywordStats.keywords[keyword].channels.includes(channelId)) {
        keywordStats.keywords[keyword].channels.push(channelId);
      }
    }
    
    // Cập nhật thống kê cho kênh
    if (!keywordStats.channels[channelId]) {
      keywordStats.channels[channelId] = {
        totalMatches: 0,
        keywords: []
      };
    }
    
    keywordStats.channels[channelId].totalMatches += matchedKeywords.length;
    
    // Thêm từ khóa mới vào danh sách kênh (trùng lặp sẽ được loại bỏ sau)
    for (const keyword of matchedKeywords) {
      if (!keywordStats.channels[channelId].keywords.includes(keyword)) {
        keywordStats.channels[channelId].keywords.push(keyword);
      }
    }
    
    // Lưu lại thống kê
    props.setProperty('KEYWORD_STATS', JSON.stringify(keywordStats));
    
  } catch (error) {
    Logger.log('Lỗi khi cập nhật thống kê từ khóa: ' + error.toString());
  }
}

// Hàm lấy thống kê từ khóa
function getKeywordStats() {
  try {
    const props = PropertiesService.getScriptProperties();
    const keywordStats = JSON.parse(props.getProperty('KEYWORD_STATS') || '{"keywords": {}, "channels": {}}');
    
    let message = "📊 <b>Thống kê từ khóa khớp</b>\n\n";
    
    // Thống kê theo từ khóa
    message += "🔍 <b>Thống kê theo từ khóa:</b>\n";
    const sortedKeywords = Object.entries(keywordStats.keywords)
      .sort((a, b) => b[1].count - a[1].count);
    
    for (const [keyword, stats] of sortedKeywords) {
      message += `• <b>${keyword}</b>: ${stats.count} lần khớp`;
      message += ` (Lần cuối: ${stats.lastMatched})\n`;
      message += `  └ Kênh: ${stats.channels.length} kênh\n`;
      if (stats.lastVideoTitle) {
        message += `  └ Video gần nhất: ${stats.lastVideoTitle.substring(0, 50)}${stats.lastVideoTitle.length > 50 ? "..." : ""}\n`;
      }
    }
    
    // Thống kê theo kênh
    message += "\n📺 <b>Thống kê theo kênh:</b>\n";
    const sortedChannels = Object.entries(keywordStats.channels)
      .sort((a, b) => b[1].totalMatches - a[1].totalMatches);
    
    for (const [channelId, stats] of sortedChannels) {
      const channelName = getChannelName(channelId);
      const channelType = getChannelType(channelId);
      message += `• ${getChannelIcon(channelType)} <b>${channelName}</b>: ${stats.totalMatches} lần khớp\n`;
      message += `  └ Từ khóa: ${stats.keywords.join(", ")}\n`;
    }
    
    sendTelegramMessage(message);
    return keywordStats;
    
  } catch (error) {
    Logger.log('Lỗi khi lấy thống kê từ khóa: ' + error.toString());
    return null;
  }
}

// Hàm đặt lại thống kê từ khóa
function resetKeywordStats() {
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('KEYWORD_STATS', '{"keywords": {}, "channels": {}}');
    Logger.log('Đã đặt lại thống kê từ khóa');
    sendTelegramMessage("📊 Thống kê từ khóa đã được đặt lại!");
  } catch (error) {
    Logger.log('Lỗi khi đặt lại thống kê từ khóa: ' + error.toString());
  }
}

// Hàm chính để kiểm tra video mới
function checkNewVideos() {
  try {
    const props = PropertiesService.getScriptProperties();
    const lastVideoIds = JSON.parse(props.getProperty('LAST_VIDEO_IDS') || '{}');
    const channelNames = JSON.parse(props.getProperty('CHANNEL_NAMES') || '{}');
    
    let updatedLastVideoIds = {...lastVideoIds};
    let hasNewVideo = false;
    
    // Kiểm tra từng kênh
    for (const channel of CHANNELS) {
      // Lấy video mới nhất từ kênh
      const latestVideo = getLatestVideo(channel.id);
      
      if (latestVideo) {
        const channelKey = channel.id;
        const storedVideoId = lastVideoIds[channelKey];
        
        // Nếu có video mới hoặc chưa từng được lưu trữ
        if (!storedVideoId || latestVideo.id !== storedVideoId) {
          // Lấy tên kênh nếu chưa có
          if (!channelNames[channelKey]) {
            channelNames[channelKey] = getChannelName(channel.id);
            props.setProperty('CHANNEL_NAMES', JSON.stringify(channelNames));
          }
          
          // Kiểm tra từ khóa trong tiêu đề
          const keywordResult = checkTitleKeywords(latestVideo.title, channel.title || "");
          
          // Chỉ gửi thông báo nếu từ khóa khớp hoặc không có từ khóa nào được chỉ định
          if (keywordResult.matched) {
            // Gửi thông báo
            sendTelegramNotification(
              channelNames[channelKey] || channel.id,
              channel.type,
              latestVideo,
              keywordResult.matchedKeywords
            );
            
            // Cập nhật thống kê từ khóa nếu có từ khóa khớp
            if (keywordResult.matchedKeywords.length > 0) {
              updateKeywordStats(channel.id, keywordResult.matchedKeywords, latestVideo.title);
            }
            
            // Cập nhật ID video mới nhất
            updatedLastVideoIds[channelKey] = latestVideo.id;
            hasNewVideo = true;
            
            // Đợi 1 giây trước khi kiểm tra kênh tiếp theo
            Utilities.sleep(1000);
          } else {
            // Nếu không khớp từ khóa, vẫn cập nhật ID video để không kiểm tra lại
            updatedLastVideoIds[channelKey] = latestVideo.id;
            hasNewVideo = true;
            Logger.log(`Video "${latestVideo.title}" từ kênh ${channelNames[channelKey] || channel.id} không khớp từ khóa, bỏ qua.`);
          }
        }
      }
    }
    
    // Lưu trạng thái mới
    if (hasNewVideo) {
      props.setProperty('LAST_VIDEO_IDS', JSON.stringify(updatedLastVideoIds));
    }
  } catch (error) {
    Logger.log('Lỗi: ' + error.toString());
  }
}

// Hàm gửi báo cáo hàng ngày lúc 7h sáng
function sendDailyReport() {
  try {
    const props = PropertiesService.getScriptProperties();
    const channelNames = JSON.parse(props.getProperty('CHANNEL_NAMES') || '{}');
    
    // Tính ngày hôm qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    
    let message = `<b>Báo cáo tin tức từ Youtube ngày ${formatDate(yesterday)}</b>\n\n`;
    let videoCount = 0;
    let keywordStats = {};
    
    // Kiểm tra từng kênh
    for (const channel of CHANNELS) {
      // Lấy tên kênh nếu chưa có
      if (!channelNames[channel.id]) {
        channelNames[channel.id] = getChannelName(channel.id);
      }
      
      // Lấy video từ ngày hôm qua với bộ lọc từ khóa
      const videos = getVideosFromChannel(channel.id, startOfDay, endOfDay, channel.title || "");
      
      if (videos.length > 0) {
        message += `${getChannelIcon(channel.type)} <b>${channelNames[channel.id] || channel.id}</b> (${channel.type}):\n`;
        
        // Giới hạn 2-3 video mới nhất
        const maxVideos = Math.min(videos.length, 3);
        for (let i = 0; i < maxVideos; i++) {
          const video = videos[i];
          message += `   ${i+1}. <a href="${video.url}">${video.title}</a>\n`;
          
          // Hiển thị từ khóa khớp nếu có
          if (video.matchedKeywords && video.matchedKeywords.length > 0) {
            message += `      🔑 Từ khóa: ${video.matchedKeywords.join(", ")}\n`;
            
            // Cập nhật thống kê từ khóa cho báo cáo
            for (const keyword of video.matchedKeywords) {
              if (!keywordStats[keyword]) {
                keywordStats[keyword] = 0;
              }
              keywordStats[keyword]++;
            }
          }
          
          videoCount++;
        }
        message += '\n';
      }
      
      // Đợi 1 giây trước khi kiểm tra kênh tiếp theo
      Utilities.sleep(1000);
    }
    
    // Thêm thống kê từ khóa vào báo cáo
    if (Object.keys(keywordStats).length > 0) {
      message += `🔑 <b>Thống kê từ khóa khớp:</b>\n`;
      const sortedKeywords = Object.entries(keywordStats)
        .sort((a, b) => b[1] - a[1]);
      
      for (const [keyword, count] of sortedKeywords) {
        message += `• ${keyword}: ${count} video\n`;
      }
      message += '\n';
    }
    
    // Lưu tên kênh
    props.setProperty('CHANNEL_NAMES', JSON.stringify(channelNames));
    
    if (videoCount > 0) {
      message += `Tổng cộng: ${videoCount} video mới`;
      sendTelegramMessage(message);
    } else {
      Logger.log('Không có video nào khớp từ khóa được đăng trong ngày hôm qua');
    }
  } catch (error) {
    Logger.log('Lỗi khi gửi báo cáo hàng ngày: ' + error.toString());
  }
}

// Lấy video từ kênh trong khoảng thời gian (có áp dụng bộ lọc từ khóa)
function getVideosFromChannel(channelId, startDate, endDate, keywordsString = "") {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&publishedAfter=${startDate.toISOString()}&publishedBefore=${endDate.toISOString()}`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    const videos = [];
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.id.kind === 'youtube#video') {
          const video = {
            id: item.id.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            publishedAt: item.snippet.publishedAt
          };
          
          // Áp dụng bộ lọc từ khóa nếu có
          if (keywordsString && keywordsString.trim() !== "") {
            const keywordResult = checkTitleKeywords(video.title, keywordsString);
            if (keywordResult.matched) {
              video.matchedKeywords = keywordResult.matchedKeywords;
              videos.push(video);
            }
          } else {
            // Nếu không có từ khóa, lấy tất cả video
            video.matchedKeywords = [];
            videos.push(video);
          }
        }
      }
    }
    
    return videos;
  } catch (error) {
    Logger.log('Lỗi khi lấy video từ kênh ' + channelId + ': ' + error.toString());
    return [];
  }
}

// Lấy video mới nhất từ kênh YouTube
function getLatestVideo(channelId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=1`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        id: video.id.videoId,
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        publishedAt: video.snippet.publishedAt
      };
    }
  } catch (error) {
    Logger.log('Lỗi khi lấy video từ kênh ' + channelId + ': ' + error.toString());
  }
  return null;
}

// Lấy tên kênh từ ID
function getChannelName(channelId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?key=${CONFIG.YOUTUBE_API_KEY}&id=${channelId}&part=snippet`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.title;
    }
  } catch (error) {
    Logger.log('Lỗi khi lấy tên kênh ' + channelId + ': ' + error.toString());
  }
  return "Unknown Channel";
}

// Gửi thông báo qua Telegram
function sendTelegramNotification(channelName, channelType, video, matchedKeywords = []) {
  try {
    const publishedDate = new Date(video.publishedAt);
    const formattedDate = formatDate(publishedDate);
    
    let message = `
🎥 <b>Video mới từ ${channelName}</b>
📁 <b>Loại:</b> ${channelType}
${getChannelIcon(channelType)} <b>Tiêu đề:</b> ${video.title}
⏰ <b>Đăng lúc:</b> ${formattedDate}
    `;
    
    // Thêm thông tin từ khóa khớp nếu có
    if (matchedKeywords && matchedKeywords.length > 0) {
      message += `🔑 <b>Từ khóa khớp:</b> ${matchedKeywords.join(", ")}\n`;
    }
    
    message += `🔗 <b>Xem ngay:</b> ${video.url}`;
    
    sendTelegramMessage(message);
    Logger.log('Đã gửi thông báo cho video mới từ kênh: ' + channelName);
  } catch (error) {
    Logger.log('Lỗi khi gửi Telegram: ' + error.toString());
  }
}

// Gửi tin nhắn Telegram
function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    method: 'post',
    payload: {
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }
  };
  
  UrlFetchApp.fetch(url, payload);
}

// Định dạng ngày tháng
function formatDate(date) {
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Hàm khởi tạo - chạy một lần đầu tiên
function initialize() {
  const props = PropertiesService.getScriptProperties();
  const initialData = {};
  const channelNames = {};
  
  // Khởi tạo thống kê từ khóa
  props.setProperty('KEYWORD_STATS', '{"keywords": {}, "channels": {}}');
  Logger.log('Đã khởi tạo thống kê từ khóa');
  
  // Khởi tạo dữ liệu cho tất cả kênh
  for (const channel of CHANNELS) {
    const latestVideo = getLatestVideo(channel.id);
    if (latestVideo) {
      initialData[channel.id] = latestVideo.id;
      channelNames[channel.id] = getChannelName(channel.id);
      Logger.log('Đã khởi tạo cho kênh: ' + channelNames[channel.id] + ', Video ID: ' + latestVideo.id);
      Utilities.sleep(1000); // Đợi 1 giây giữa các yêu cầu
    }
  }
  
  props.setProperty('LAST_VIDEO_IDS', JSON.stringify(initialData));
  props.setProperty('CHANNEL_NAMES', JSON.stringify(channelNames));
  Logger.log('Khởi tạo hoàn tất!');
}

// Hàm test - kiểm tra gửi thông báo
function testNotification() {
  Logger.log("Bắt đầu kiểm tra thông báo...");
  
  // Kiểm tra lấy tên kênh
  for (const channel of CHANNELS) {
    const channelName = getChannelName(channel.id);
    Logger.log(`Kênh: ${channel.id} -> Tên: ${channelName}, Từ khóa: ${channel.title || "Không lọc"}`);
    Utilities.sleep(1000);
  }
  
  // Kiểm tra lấy video mới nhất
  const testChannel = CHANNELS[0];
  const latestVideo = getLatestVideo(testChannel.id);
  if (latestVideo) {
    Logger.log(`Video mới nhất: ${latestVideo.title}`);
    
    // Kiểm tra từ khóa
    const keywordResult = checkTitleKeywords(latestVideo.title, testChannel.title || "");
    Logger.log(`Khớp từ khóa: ${keywordResult.matched ? "Có" : "Không"}`);
    if (keywordResult.matchedKeywords.length > 0) {
      Logger.log(`Từ khóa khớp: ${keywordResult.matchedKeywords.join(", ")}`);
    }
    
    // Chỉ gửi thông báo nếu khớp từ khóa hoặc không có từ khóa
    if (keywordResult.matched) {
      // Kiểm tra gửi thông báo
      const channelName = getChannelName(testChannel.id);
      sendTelegramNotification(channelName, testChannel.type, latestVideo, keywordResult.matchedKeywords);
      Logger.log("Đã gửi thông báo test!");
    } else {
      Logger.log("Video không khớp từ khóa, không gửi thông báo test");
    }
  } else {
    Logger.log("Không tìm thấy video nào để test");
  }
}

// Hàm test báo cáo hàng ngày
function testDailyReport() {
  Logger.log("Bắt đầu kiểm tra báo cáo hàng ngày...");
  
  // Thiết lập ngày hôm qua
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
  
  Logger.log(`Kiểm tra video từ ${startOfDay} đến ${endOfDay}`);
  
  // Kiểm tra lấy video từ kênh
  for (const channel of CHANNELS) {
    const videos = getVideosFromChannel(channel.id, startOfDay, endOfDay);
    Logger.log(`Kênh ${channel.id} có ${videos.length} video`);
    
    if (videos.length > 0) {
      for (const video of videos) {
        Logger.log(`- ${video.title}`);
      }
    }
    
    Utilities.sleep(1000);
  }
  
  // Gửi báo cáo test
  sendDailyReport();
  Logger.log("Đã gửi báo cáo test!");
}

// Hàm test chức năng lọc từ khóa
function testKeywordFilter() {
  Logger.log("Bắt đầu kiểm tra chức năng lọc từ khóa...");
  
  // Test cases
  const testCases = [
    { title: "SEO Tutorial for Beginners", keywords: "tutorial,seo", expected: true },
    { title: "Advanced Google Ads Techniques", keywords: "tutorial,seo", expected: false },
    { title: "Complete Guide to Facebook Marketing", keywords: "guide,marketing", expected: true },
    { title: "Data Analysis with Python", keywords: "marketing,tips", expected: false },
    { title: "AI and Machine Learning", keywords: "", expected: true }, // Không lọc
    { title: "Tips for Better Conversion Tracking", keywords: "tips,tracking", expected: true },
    { title: "PAY PER CLICK STRATEGY", keywords: "ppc,pay per click", expected: true }, // Test không phân biệt hoa/thường
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = checkTitleKeywords(testCase.title, testCase.keywords);
    
    if (result.matched === testCase.expected) {
      Logger.log(`✅ Test ${i+1} PASSED: "${testCase.title}" với từ khóa "${testCase.keywords}"`);
      passedTests++;
    } else {
      Logger.log(`❌ Test ${i+1} FAILED: "${testCase.title}" với từ khóa "${testCase.keywords}" - Expected: ${testCase.expected}, Got: ${result.matched}`);
    }
    
    if (result.matched) {
      Logger.log(`   Từ khóa khớp: ${result.matchedKeywords.join(", ")}`);
    }
  }
  
  Logger.log(`\nKết quả: ${passedTests}/${totalTests} tests passed`);
  
  // Test với kênh thực tế
  Logger.log("\nKiểm tra với kênh thực tế...");
  const testChannel = CHANNELS[0];
  const latestVideo = getLatestVideo(testChannel.id);
  
  if (latestVideo) {
    Logger.log(`Kênh: ${testChannel.type} (${testChannel.id})`);
    Logger.log(`Từ khóa: ${testChannel.title}`);
    Logger.log(`Video mới nhất: "${latestVideo.title}"`);
    
    const keywordResult = checkTitleKeywords(latestVideo.title, testChannel.title || "");
    Logger.log(`Khớp từ khóa: ${keywordResult.matched ? "Có" : "Không"}`);
    if (keywordResult.matchedKeywords.length > 0) {
      Logger.log(`Từ khóa khớp: ${keywordResult.matchedKeywords.join(", ")}`);
    }
  } else {
    Logger.log("Không tìm thấy video nào để test");
  }
}

// Hàm test thống kê từ khóa
function testKeywordStats() {
  Logger.log("Bắt đầu kiểm tra thống kê từ khóa...");
  
  // Test cập nhật thống kê
  const testChannelId = "test_channel_id";
  const testKeywords = ["tutorial", "seo"];
  const testVideoTitle = "SEO Tutorial for Beginners";
  
  updateKeywordStats(testChannelId, testKeywords, testVideoTitle);
  Logger.log("Đã cập nhật thống kê test");
  
  // Lấy và hiển thị thống kê
  getKeywordStats();
  
  Logger.log("Hoàn thành kiểm tra thống kê từ khóa!");
}

// Hàm test icon kênh
function testChannelIcons() {
  Logger.log("Bắt đầu kiểm tra icon kênh...");
  
  // Test tất cả các loại kênh
  const channelTypes = [
    "Facebook Ads", "Tiktok Ads", "PPC Ads", "Display Ads", "Google Ads",
    "Digital Marketing", "SEO",
    "Tracking", "Data Analysis",
    "AI", "Unknown Type"
  ];
  
  Logger.log("=== KIỂM TRA ICON CHO TỪNG LOẠI KÊNH ===");
  for (const type of channelTypes) {
    const icon = getChannelIcon(type);
    Logger.log(`${type}: ${icon}`);
  }
  
  // Test với các kênh thực tế trong mảng CHANNELS
  Logger.log("\n=== KIỂM TRA ICON CHO CÁC KÊNH THỰC TẾ ===");
  for (const channel of CHANNELS) {
    const icon = getChannelIcon(channel.type);
    Logger.log(`${channel.type} (${channel.id}): ${icon}`);
  }
  
  Logger.log("Hoàn thành kiểm tra icon kênh!");
}
/*
============================================
HƯỚNG DẪN SỬ DỤNG YOUTUBE NOTICE SCRIPT v2.1
============================================

CẬP NHẬT MỚI v2.1:
- Phân loại icon theo nhóm kênh:
  + Nhóm Quảng cáo (Facebook Ads, Tiktok Ads, PPC Ads, Display Ads, Google Ads): 📢
  + Nhóm Marketing/SEO (Digital Marketing, SEO): 📈
  + Nhóm Phân tích/Dữ liệu (Tracking, Data Analysis): 📊
  + Nhóm Khác (AI): 🤖

CẬP NHẬT MỚI v2.0:
- Thêm chức năng lọc video theo từ khóa trong tiêu đề
- Thống kê từ khóa khớp
- Báo cáo hàng ngày chỉ hiển thị video khớp từ khóa

============================================
CẤU HÌNH KÊNH (CHANNELS)
============================================

Cấu trúc mới của CHANNELS:
{ id: "CHANNEL_ID", type: "LOẠI KÊNH", title: "từ_khóa_1,từ_khóa_2,từ_khóa_3" }

Trong đó:
- id: ID của kênh YouTube
- type: Loại kênh (SEO, Google Ads, AI, v.v.)
- title: Chuỗi từ khóa cách nhau bằng dấu phẩy
  + Nếu để trống "" sẽ lấy tất cả video
  + Không phân biệt chữ hoa/thường
  + Video chỉ được thông báo nếu tiêu đề chứa ít nhất 1 từ khóa

VÍ DỤ:
{ id: "UCWquNQV8Y0_defMKnGKrFOQ", type: "SEO", title: "tutorial,guide,tips,seo" }
{ id: "UCgl9rHdm9KojNRWs56QI_hg", type: "Google Ads", title: "" } // Lấy tất cả video

============================================
CÁC HÀM CHÍNH
============================================

1. initialize() - Khởi tạo script (chạy 1 lần đầu tiên)
2. checkNewVideos() - Kiểm tra video mới và gửi thông báo
3. sendDailyReport() - Gửi báo cáo hàng ngày (chạy lúc 7h sáng)
4. testNotification() - Test gửi thông báo
5. testDailyReport() - Test báo cáo hàng ngày
6. testKeywordFilter() - Test chức năng lọc từ khóa
7. testKeywordStats() - Test thống kê từ khóa
8. testChannelIcons() - Test icon cho từng loại kênh
9. getKeywordStats() - Xem thống kê từ khóa khớp
10. resetKeywordStats() - Đặt lại thống kê từ khóa

============================================
CÁCH THIẾT LẬP TRIGGER
============================================

1. Trigger cho checkNewVideos():
   - Chọn "Resources" > "Triggers"
   - Add trigger
   - Function: checkNewVideos
   - Time-driven: Minutes timer, Every 15 minutes

2. Trigger cho sendDailyReport():
   - Add trigger
   - Function: sendDailyReport
   - Time-driven: Day timer, 7am-8am

============================================
THỐNG KÊ TỪ KHÓA
============================================

- Gọi getKeywordStats() để xem thống kê
- Gọi resetKeywordStats() để đặt lại thống kê
- Thống kê bao gồm:
  + Số lần từ khóa khớp
  + Ngày khớp gần nhất
  + Kênh có từ khóa khớp
  + Video gần nhất khớp từ khóa

============================================
LƯU Ý QUAN TRỌNG
============================================

1. Chạy initialize() lần đầu trước khi sử dụng
2. Kiểm tra testKeywordFilter() để đảm bảo lọc hoạt động đúng
3. Từ khóa không phân biệt chữ hoa/thường
4. Video không khớp từ khóa sẽ không được thông báo
5. Báo cáo hàng ngày chỉ hiển thị video khớp từ khóa

============================================
*/
