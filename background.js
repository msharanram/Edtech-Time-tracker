
const edtechDomains = {
  'youtube.com': {
    name: 'YouTube',
    // Only count time on YouTube if it's educational content (e.g., in /playlist, /watch with edu-related parameters)
    pathPatterns: ['/playlist', '/watch']
  },
  'udemy.com': {
    name: 'Udemy',
    pathPatterns: ['/course']
  },
  'coursera.org': {
    name: 'Coursera',
    pathPatterns: ['/learn']
  },
  'edx.org': {
    name: 'edX',
    pathPatterns: ['/course']
  },
  'khanacademy.org': {
    name: 'Khan Academy',
    pathPatterns: []  // All paths on Khan Academy are educational
  },
  'skillshare.com': {
    name: 'Skillshare',
    pathPatterns: ['/classes']
  },
  'pluralsight.com': {
    name: 'Pluralsight',
    pathPatterns: ['/course']
  },
  'linkedin.com/learning': {
    name: 'LinkedIn Learning',
    pathPatterns: []  // All paths under linkedin.com/learning are educational
  }
};

// Initialize variables to track the current session
let currentSession = {
  domain: null,
  appName: null,
  startTime: null,
  active: false
};

// Check for activity every second
const POLLING_INTERVAL_MS = 1000;
// Idle timeout (5 minutes without activity)
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
// Last active timestamp
let lastActiveTime = Date.now();

// Initialize data storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['trackingData', 'userSettings'], (result) => {
    // Initialize tracking data if it doesn't exist
    if (!result.trackingData) {
      chrome.storage.local.set({
        trackingData: {
          daily: {},
          weekly: {},
          monthly: {},
          streaks: {
            current: 0,
            lastStreakDate: null
          },
          lastActiveDate: null
        }
      });
    }
    
    // Initialize user settings if they don't exist
    if (!result.userSettings) {
      chrome.storage.local.set({
        userSettings: {
          streakGoalMinutes: 40, // Default streak goal (40 minutes)
          trackingEnabled: true
        }
      });
    }
  });
  
  // Set up daily summary alarm (runs at midnight)
  chrome.alarms.create('dailySummary', {
    periodInMinutes: 24 * 60,
    when: getNextMidnight()
  });
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailySummary') {
    processDailySummary();
  }
});

// Track URL changes and tab activity
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    checkAndUpdateTracking(tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkAndUpdateTracking(tab.url);
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTrackingStatus') {
    console.log('Background script received tracking status update:', message.isEnabled);
    handleTrackingStatusChange(message.isEnabled);
    sendResponse({ success: true });
  } else if (message.action === 'resetData') {
    console.log('Background script received reset data request');
    resetAllTracking();
    sendResponse({ success: true });
  } else if (message.action === 'getTrackingData') {
    // Add a handler to fetch current tracking data for the popup
    chrome.storage.local.get(['trackingData', 'userSettings'], (result) => {
      sendResponse({ 
        trackingData: result.trackingData,
        userSettings: result.userSettings 
      });
    });
    return true; // Indicates async response
  }
  return true; // Indicates async response
});

// Function to handle reset request
function resetAllTracking() {
  // End any active session
  endCurrentSession();
  
  // Reset time tracking variables
  lastActiveTime = Date.now();
  
  // Reset session data
  currentSession = {
    domain: null,
    appName: null,
    startTime: null,
    active: false
  };
  
  // Clear stored tracking data
  chrome.storage.local.set({
    trackingData: {
      daily: {},
      weekly: {},
      monthly: {},
      streaks: {
        current: 0,
        lastStreakDate: null
      },
      lastActiveDate: null
    }
  });
  
  console.log('All tracking data has been reset in background');
  
  // Check current tab after reset
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      checkAndUpdateTracking(tabs[0].url);
    }
  });
}

// Handle tracking status changes
function handleTrackingStatusChange(isEnabled) {
  // Update the current session based on tracking status
  if (!isEnabled && currentSession.active) {
    // If tracking is disabled, end current session
    endCurrentSession();
  } else if (isEnabled) {
    // If tracking is enabled, check current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        checkAndUpdateTracking(tabs[0].url);
      }
    });
  }
  
  // Save the tracking status to storage
  chrome.storage.local.get(['userSettings'], (result) => {
    const userSettings = result.userSettings || {};
    userSettings.trackingEnabled = isEnabled;
    chrome.storage.local.set({ userSettings });
  });
}

// Set up polling to check if user is still active
setInterval(() => {
  chrome.storage.local.get(['userSettings'], (result) => {
    const trackingEnabled = result.userSettings?.trackingEnabled !== false;
    
    if (!trackingEnabled) {
      // If tracking is disabled, don't proceed
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && currentSession.active) {
        // Update last active time
        lastActiveTime = Date.now();
        
        // Log time for current session
        if (currentSession.domain) {
          updateTimeTracking();
        }
      } else if (currentSession.active && (Date.now() - lastActiveTime > IDLE_TIMEOUT_MS)) {
        // User has been idle for too long, stop tracking
        endCurrentSession();
      }
    });
  });
}, POLLING_INTERVAL_MS);

// Check if URL is an educational site we should track
function checkAndUpdateTracking(url) {
  if (!url) return;
  
  // Check if tracking is enabled
  chrome.storage.local.get(['userSettings'], (result) => {
    const userSettings = result.userSettings || { trackingEnabled: true };
    
    // Don't track if tracking is disabled
    if (userSettings.trackingEnabled === false) {
      if (currentSession.active) {
        endCurrentSession();
      }
      return;
    }
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const path = urlObj.pathname;
      
      // Check if hostname contains any of our edtech domains
      let matchedDomain = null;
      let matchedApp = null;
      
      for (const domain in edtechDomains) {
        if (hostname.includes(domain)) {
          const app = edtechDomains[domain];
          
          // If pathPatterns is empty, track all paths
          // Otherwise, check if current path matches any pattern
          if (app.pathPatterns.length === 0 || 
              app.pathPatterns.some(pattern => path.includes(pattern))) {
            matchedDomain = domain;
            matchedApp = app.name;
            break;
          }
        }
      }
      
      if (matchedDomain) {
        // We're on an educational site we should track
        if (currentSession.domain !== matchedDomain) {
          // End previous session if there was one
          if (currentSession.active) {
            endCurrentSession();
          }
          
          // Start new session
          currentSession = {
            domain: matchedDomain,
            appName: matchedApp,
            startTime: Date.now(),
            active: true
          };
        }
      } else if (currentSession.active) {
        // We've navigated away from an educational site
        endCurrentSession();
      }
    } catch (e) {
      console.error("Error processing URL:", e);
    }
  });
}

// Update time tracking data
function updateTimeTracking() {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentWeek = getWeekNumber(now);
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  const weekKey = `${currentYear}-W${currentWeek}`;
  const monthKey = `${currentYear}-${currentMonth}`;
  
  chrome.storage.local.get(['trackingData'], (result) => {
    const trackingData = result.trackingData || {
      daily: {},
      weekly: {},
      monthly: {},
      streaks: { current: 0, lastStreakDate: null },
      lastActiveDate: null
    };
    
    // Initialize today's data if it doesn't exist
    if (!trackingData.daily[today]) {
      trackingData.daily[today] = {};
    }
    
    // Initialize weekly data if it doesn't exist
    if (!trackingData.weekly[weekKey]) {
      trackingData.weekly[weekKey] = {};
    }
    
    // Initialize monthly data if it doesn't exist
    if (!trackingData.monthly[monthKey]) {
      trackingData.monthly[monthKey] = {};
    }
    
    // Update app-specific time (in seconds)
    if (!trackingData.daily[today][currentSession.appName]) {
      trackingData.daily[today][currentSession.appName] = 0;
    }
    trackingData.daily[today][currentSession.appName] += POLLING_INTERVAL_MS / 1000;
    
    if (!trackingData.weekly[weekKey][currentSession.appName]) {
      trackingData.weekly[weekKey][currentSession.appName] = 0;
    }
    trackingData.weekly[weekKey][currentSession.appName] += POLLING_INTERVAL_MS / 1000;
    
    if (!trackingData.monthly[monthKey][currentSession.appName]) {
      trackingData.monthly[monthKey][currentSession.appName] = 0;
    }
    trackingData.monthly[monthKey][currentSession.appName] += POLLING_INTERVAL_MS / 1000;
    
    // Update last active date
    trackingData.lastActiveDate = today;
    
    // Save updated tracking data
    chrome.storage.local.set({ trackingData });
    
    // Check if today's total time meets the streak goal
    checkAndUpdateStreak(trackingData, today);
  });
}

// End current tracking session
function endCurrentSession() {
  if (!currentSession.active) return;
  
  currentSession.active = false;
  currentSession.domain = null;
  currentSession.appName = null;
  currentSession.startTime = null;
}

// Process daily summary
function processDailySummary() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Cleanup old data (keep only last 90 days, 12 weeks, 12 months)
  chrome.storage.local.get(['trackingData'], (result) => {
    if (!result.trackingData) return;
    
    const trackingData = result.trackingData;
    const now = new Date();
    
    // Clean up daily data (keep 90 days)
    const dailyData = trackingData.daily;
    const cutoffDaily = new Date();
    cutoffDaily.setDate(cutoffDaily.getDate() - 90);
    
    Object.keys(dailyData).forEach(date => {
      if (new Date(date) < cutoffDaily) {
        delete dailyData[date];
      }
    });
    
    // Clean up weekly data (keep 12 weeks)
    const weeklyData = trackingData.weekly;
    const cutoffWeekly = new Date();
    cutoffWeekly.setDate(cutoffWeekly.getDate() - 12 * 7);
    
    Object.keys(weeklyData).forEach(weekKey => {
      const [year, week] = weekKey.split('-W');
      const weekDate = getDateOfWeek(parseInt(week), parseInt(year));
      if (weekDate < cutoffWeekly) {
        delete weeklyData[weekKey];
      }
    });
    
    // Clean up monthly data (keep 12 months)
    const monthlyData = trackingData.monthly;
    const cutoffMonthly = new Date();
    cutoffMonthly.setMonth(cutoffMonthly.getMonth() - 12);
    
    Object.keys(monthlyData).forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (monthDate < cutoffMonthly) {
        delete monthlyData[monthKey];
      }
    });
    
    // Check streak status for yesterday
    checkAndUpdateStreak(trackingData, yesterdayStr, true);
    
    // Save updated tracking data
    chrome.storage.local.set({ trackingData });
  });
}

// Check and update streak if daily goal is met
function checkAndUpdateStreak(trackingData, date, isFinalCheck = false) {
  chrome.storage.local.get(['userSettings'], (result) => {
    const streakGoalSeconds = (result.userSettings?.streakGoalMinutes || 40) * 60;
    const dayData = trackingData.daily[date] || {};
    
    // Calculate total time for the day
    let totalSeconds = 0;
    Object.values(dayData).forEach(seconds => {
      totalSeconds += seconds;
    });
    
    // If total time meets the goal and we haven't already counted this day
    if (totalSeconds >= streakGoalSeconds) {
      if (!trackingData.streaks.lastStreakDate || trackingData.streaks.lastStreakDate !== date) {
        // Check if this is a consecutive day
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (trackingData.streaks.lastStreakDate === yesterdayStr) {
          // Consecutive day, increment streak
          trackingData.streaks.current += 1;
        } else {
          // Non-consecutive, reset streak to 1
          trackingData.streaks.current = 1;
        }
        
        trackingData.streaks.lastStreakDate = date;
        chrome.storage.local.set({ trackingData });
      }
    } else if (isFinalCheck && trackingData.streaks.lastStreakDate) {
      // If this is final check for the day and we didn't meet the goal
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // If our last streak was more than 1 day ago, reset the streak
      if (trackingData.streaks.lastStreakDate !== yesterdayStr) {
        trackingData.streaks.current = 0;
        chrome.storage.local.set({ trackingData });
      }
    }
  });
}

// Helper function to get the next midnight timestamp
function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Helper function to get the week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Helper function to get the date of a week
function getDateOfWeek(week, year) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = firstDayOfYear.getDay() - 1;
  const firstWeekDayOne = firstDayOfYear.getTime() - daysOffset * 86400000;
  const dateTime = firstWeekDayOne + 604800000 * (week - 1);
  return new Date(dateTime);
}

// Helper function to format time in hours and minutes
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}