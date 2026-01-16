// File: youtube-channel-id-extractor.js
// Chức năng: Lấy ID kênh YouTube từ URL kênh

// Sử dụng CONFIG.YOUTUBE_API_KEY từ file chính

// Array URLs kênh YouTube cần lấy ID
const CHANNEL_URLS = [
    "https://www.youtube.com/@ZoCoMarketing/",
    // Thêm URLs ở đây...
];

/**
 * Hàm chính: Lấy Channel ID từ array URLs đã định nghĩa sẵn
 */
function getChannelIdFromUrl() {
    Logger.log("=== Bắt đầu lấy Channel ID từ URLs ===");
    Logger.log(`Tổng số URLs: ${CHANNEL_URLS.length}\n`);

    const results = [];

    CHANNEL_URLS.forEach((url, index) => {
        Logger.log(`[${index + 1}/${CHANNEL_URLS.length}] Xử lý: ${url}`);
        const result = processSingleUrl(url);
        results.push(result);

        if (result.success) {
            Logger.log(`✅ ${result.channelName} → ${result.channelId}`);
        } else {
            Logger.log(`❌ Lỗi: ${result.error}`);
        }

        // Đợi 1 giây giữa các request
        if (index < CHANNEL_URLS.length - 1) {
            Utilities.sleep(1000);
        }
        Logger.log("");
    });

    // Tổng kết
    const successCount = results.filter(r => r.success).length;
    Logger.log("===================");
    Logger.log(`📊 Tổng kết: ${successCount}/${CHANNEL_URLS.length} thành công`);

    // In ra danh sách Channel IDs
    Logger.log("\n📋 Danh sách Channel IDs:");
    results.forEach((result, index) => {
        if (result.success) {
            Logger.log(`  { id: "${result.channelId}", name: "${result.channelName}" },`);
        }
    });

    return results;
}

/**
 * Xử lý một URL duy nhất
 */
function processSingleUrl(channelUrl) {
    try {
        // Kiểm tra và làm sạch URL
        if (!channelUrl || typeof channelUrl !== 'string') {
            throw new Error('URL không hợp lệ hoặc không phải là string.');
        }

        const cleanUrl = channelUrl.trim();

        // Kiểm tra URL có hợp lệ không
        if (!cleanUrl.includes('youtube.com')) {
            throw new Error('URL không hợp lệ. Vui lòng nhập URL YouTube.');
        }

        // Trường hợp 1: URL đã chứa Channel ID (UC...)
        const channelIdMatch = cleanUrl.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
        if (channelIdMatch) {
            const channelId = channelIdMatch[1];
            Logger.log(`Tìm thấy Channel ID trực tiếp: ${channelId}`);
            return {
                success: true,
                channelId: channelId,
                channelName: getChannelName(channelId),
                method: 'direct'
            };
        }

        // Trường hợp 2: URL dạng /c/channelname
        const customUrlMatch = cleanUrl.match(/\/c\/([a-zA-Z0-9_-]+)/);
        if (customUrlMatch) {
            const customName = customUrlMatch[1];
            Logger.log(`Tìm thấy custom URL: ${customName}`);
            return searchChannelByCustomUrl(customName, 'c');
        }

        // Trường hợp 3: URL dạng /@channelname
        const handleMatch = cleanUrl.match(/\/@([a-zA-Z0-9_-]+)/);
        if (handleMatch) {
            const handle = handleMatch[1];
            Logger.log(`Tìm thấy handle: @${handle}`);
            return searchChannelByCustomUrl(handle, 'handle');
        }

        // Trường hợp 4: URL dạng /user/username
        const userMatch = cleanUrl.match(/\/user\/([a-zA-Z0-9_-]+)/);
        if (userMatch) {
            const username = userMatch[1];
            Logger.log(`Tìm thấy username: ${username}`);
            return searchChannelByCustomUrl(username, 'user');
        }

        throw new Error('Không thể nhận diện định dạng URL này.');

    } catch (error) {
        Logger.log('Lỗi khi xử lý URL: ' + error.toString());
        return {
            success: false,
            error: error.toString(),
            url: channelUrl
        };
    }
}

/**
 * Tìm kiếm Channel ID thông qua YouTube API bằng custom URL/handle/username
 */
function searchChannelByCustomUrl(identifier, type) {
    try {
        // Thử tìm kiếm bằng forHandle (cho @channelname)
        if (type === 'handle') {
            const handleResult = searchByHandle(identifier);
            if (handleResult.success) {
                return handleResult;
            }
        }

        // Thử tìm kiếm bằng forUsername (cho user/username)
        if (type === 'user') {
            const userResult = searchByUsername(identifier);
            if (userResult.success) {
                return userResult;
            }
        }

        // Phương pháp cuối: Tìm kiếm chung
        return searchChannelByQuery(identifier, type);

    } catch (error) {
        Logger.log(`Lỗi khi tìm kiếm ${type}/${identifier}: ` + error.toString());
        return {
            success: false,
            error: error.toString()
        };
    }
}

/**
 * Tìm kiếm bằng handle (@channelname)
 */
function searchByHandle(handle) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/channels?key=${CONFIG.YOUTUBE_API_KEY}&forHandle=${handle}&part=id,snippet`;
        const response = UrlFetchApp.fetch(url);
        const data = JSON.parse(response.getContentText());

        if (data.items && data.items.length > 0) {
            const channel = data.items[0];
            return {
                success: true,
                channelId: channel.id,
                channelName: channel.snippet.title,
                method: 'handle'
            };
        }

        return { success: false };
    } catch (error) {
        Logger.log('Lỗi searchByHandle: ' + error.toString());
        return { success: false };
    }
}

/**
 * Tìm kiếm bằng username
 */
function searchByUsername(username) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/channels?key=${CONFIG.YOUTUBE_API_KEY}&forUsername=${username}&part=id,snippet`;
        const response = UrlFetchApp.fetch(url);
        const data = JSON.parse(response.getContentText());

        if (data.items && data.items.length > 0) {
            const channel = data.items[0];
            return {
                success: true,
                channelId: channel.id,
                channelName: channel.snippet.title,
                method: 'username'
            };
        }

        return { success: false };
    } catch (error) {
        Logger.log('Lỗi searchByUsername: ' + error.toString());
        return { success: false };
    }
}

/**
 * Tìm kiếm kênh bằng Search API (phương pháp cuối)
 */
function searchChannelByQuery(identifier, type) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.YOUTUBE_API_KEY}&q=${encodeURIComponent(identifier)}&type=channel&part=id,snippet&maxResults=5`;
        const response = UrlFetchApp.fetch(url);
        const data = JSON.parse(response.getContentText());

        if (data.items && data.items.length > 0) {
            // Lấy kết quả đầu tiên (có thể không chính xác 100%)
            const channel = data.items[0];
            return {
                success: true,
                channelId: channel.id.channelId,
                channelName: channel.snippet.title,
                method: 'search',
                note: 'Kết quả từ tìm kiếm - có thể không chính xác 100%'
            };
        }

        return {
            success: false,
            error: `Không tìm thấy kênh với ${type}: ${identifier}`
        };

    } catch (error) {
        Logger.log('Lỗi searchChannelByQuery: ' + error.toString());
        return {
            success: false,
            error: error.toString()
        };
    }
}

/**
 * Hàm test để kiểm tra các loại URL (có thể test cả array)
 */
function testChannelIdExtraction() {
    Logger.log("=== Test lấy Channel ID từ URL ===");

    // Test single URL
    Logger.log("\n--- Test Single URL ---");
    const singleUrl = "https://www.youtube.com/channel/UCWquNQV8Y0_defMKnGKrFOQ";
    const singleResult = getChannelIdFromUrl(singleUrl);
    logResult(singleResult, singleUrl);

    // Test array URLs
    Logger.log("\n--- Test Array URLs ---");
    const testUrls = [
        "https://www.youtube.com/channel/UCWquNQV8Y0_defMKnGKrFOQ",
        "https://www.youtube.com/@MrBeast",
        "https://www.youtube.com/c/TechReview",
        "https://www.youtube.com/user/GoogleDevelopers"
    ];

    const results = getChannelIdFromUrl(testUrls);

    // Log kết quả array
    if (Array.isArray(results)) {
        results.forEach((result, index) => {
            Logger.log(`\nKết quả ${index + 1}:`);
            logResult(result, testUrls[index]);
        });
    }
}

/**
 * Hàm helper để log kết quả
 */
function logResult(result, url) {
    Logger.log(`URL: ${url}`);
    if (result.success) {
        Logger.log(`✅ Thành công!`);
        Logger.log(`   Channel ID: ${result.channelId}`);
        Logger.log(`   Channel Name: ${result.channelName}`);
        Logger.log(`   Method: ${result.method}`);
        if (result.note) {
            Logger.log(`   Note: ${result.note}`);
        }
    } else {
        Logger.log(`❌ Thất bại: ${result.error}`);
    }
}

/**
 * Hàm để xử lý nhiều URL cùng lúc với format đẹp
 */
function processMultipleUrls(urlArray) {
    Logger.log("=== Xử lý nhiều URL ===");

    if (!Array.isArray(urlArray)) {
        Logger.log("Input phải là array của URLs");
        return;
    }

    const results = getChannelIdFromUrl(urlArray);

    if (Array.isArray(results)) {
        Logger.log(`\nĐã xử lý ${results.length} URL(s):`);

        results.forEach((result, index) => {
            Logger.log(`\n${index + 1}. ${urlArray[index]}`);

            if (result.success) {
                Logger.log(`   ✅ ${result.channelName} (${result.channelId})`);
            } else {
                Logger.log(`   ❌ ${result.error}`);
            }
        });

        // Tổng hợp
        const successCount = results.filter(r => r.success).length;
        Logger.log(`\n📊 Tổng kết: ${successCount}/${results.length} thành công`);

        return results;
    }

    return results;
}

/**
 * Ví dụ sử dụng với array URLs
 */
function exampleUsage() {
    // Ví dụ 1: Single URL
    const singleUrl = "https://www.youtube.com/@MrBeast";
    const result1 = getChannelIdFromUrl(singleUrl);
    Logger.log("Single result:", result1);

    // Ví dụ 2: Array URLs
    const multipleUrls = [
        "https://www.youtube.com/channel/UCWquNQV8Y0_defMKnGKrFOQ",
        "https://www.youtube.com/@pewdiepie",
        "https://www.youtube.com/c/TechReview"
    ];

    const results = getChannelIdFromUrl(multipleUrls);
    Logger.log("Multiple results:", results);

    // Ví dụ 3: Sử dụng hàm helper
    processMultipleUrls(multipleUrls);
}

/**
 * Hàm tiện ích để lấy thông tin kênh từ URL (kết hợp cả hai chức năng)
 */
function getChannelInfoFromUrl(channelUrl) {
    const result = getChannelIdFromUrl(channelUrl);

    if (result.success) {
        // Lấy thêm thông tin chi tiết về kênh
        const channelInfo = getDetailedChannelInfo(result.channelId);

        return {
            ...result,
            ...channelInfo
        };
    }

    return result;
}

/**
 * Lấy thông tin chi tiết về kênh
 */
function getDetailedChannelInfo(channelId) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/channels?key=${CONFIG.YOUTUBE_API_KEY}&id=${channelId}&part=snippet,statistics`;
        const response = UrlFetchApp.fetch(url);
        const data = JSON.parse(response.getContentText());

        if (data.items && data.items.length > 0) {
            const channel = data.items[0];
            return {
                description: channel.snippet.description,
                subscriberCount: channel.statistics.subscriberCount,
                videoCount: channel.statistics.videoCount,
                viewCount: channel.statistics.viewCount,
                publishedAt: channel.snippet.publishedAt,
                thumbnails: channel.snippet.thumbnails
            };
        }
    } catch (error) {
        Logger.log('Lỗi khi lấy thông tin chi tiết: ' + error.toString());
    }

    return {};
}

/**
 * Hàm để người dùng nhập URL và lấy ID
 */
function extractChannelId() {
    // Trong Google Apps Script, có thể dùng Browser.inputBox hoặc tạo HTML dialog
    const url = Browser.inputBox('Nhập URL kênh YouTube:', Browser.Buttons.OK_CANCEL);

    if (url === 'cancel' || !url) {
        Logger.log('Người dùng đã hủy.');
        return;
    }

    Logger.log(`URL nhập: ${url}`);
    const result = getChannelInfoFromUrl(url);

    if (result.success) {
        Logger.log('=== THÔNG TIN KÊNH ===');
        Logger.log(`Channel ID: ${result.channelId}`);
        Logger.log(`Tên kênh: ${result.channelName}`);
        Logger.log(`Subscriber: ${result.subscriberCount || 'N/A'}`);
        Logger.log(`Số video: ${result.videoCount || 'N/A'}`);
        Logger.log(`Tổng view: ${result.viewCount || 'N/A'}`);

        // Hiển thị kết quả cho người dùng
        Browser.msgBox(
            'Thành công!',
            `Channel ID: ${result.channelId}\nTên kênh: ${result.channelName}`,
            Browser.Buttons.OK
        );
    } else {
        Logger.log(`Lỗi: ${result.error}`);
        Browser.msgBox('Lỗi', result.error, Browser.Buttons.OK);
    }
}
