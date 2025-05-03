// document.addEventListener('DOMContentLoaded', function() {
//   // Load tracking data and populate UI
//   updateUI();
  
//   // Set up tab navigation
//   const tabButtons = document.querySelectorAll('.tab-btn');
//   tabButtons.forEach(button => {
//     button.addEventListener('click', () => {
//       // Remove active class from all tabs
//       tabButtons.forEach(btn => btn.classList.remove('active'));
//       document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
//       // Add active class to clicked tab
//       button.classList.add('active');
//       const tabId = `${button.dataset.period}-content`;
//       document.getElementById(tabId).classList.add('active');
//     });
//   });
  
//   // Set up streak goal input
//   const streakGoalInput = document.getElementById('streakGoal');
//   streakGoalInput.addEventListener('change', () => {
//     const newGoal = parseInt(streakGoalInput.value, 10);
//     if (newGoal > 0) {
//       chrome.storage.local.get(['userSettings'], (result) => {
//         const settings = result.userSettings || {};
//         settings.streakGoalMinutes = newGoal;
//         chrome.storage.local.set({ userSettings });
//         updateUI(); // Update progress bars
//       });
//     }
//   });
  
//   // Set up tracking toggle
//   const trackingToggle = document.getElementById('trackingToggle');
//   trackingToggle.addEventListener('change', () => {
//     chrome.storage.local.get(['userSettings'], (result) => {
//       const settings = result.userSettings || {};
//       settings.trackingEnabled = trackingToggle.checked;
//       chrome.storage.local.set({ userSettings });
//     });
//   });
// });

// // Load data and update UI
// function updateUI() {
//   chrome.storage.local.get(['trackingData', 'userSettings'], (result) => {
//     const trackingData = result.trackingData || {
//       daily: {},
//       weekly: {},
//       monthly: {},
//       streaks: { current: 0 }
//     };
    
//     const userSettings = result.userSettings || {
//       streakGoalMinutes: 40,
//       trackingEnabled: true
//     };
    
//     // Update streak counter
//     document.getElementById('streakCounter').textContent = trackingData.streaks.current;
    
//     // Update streak goal input
//     document.getElementById('streakGoal').value = userSettings.streakGoalMinutes;
    
//     // Update tracking toggle
//     document.getElementById('trackingToggle').checked = userSettings.trackingEnabled;
    
//     // Update daily stats
//     updatePeriodStats('daily', trackingData.daily, userSettings);
    
//     // Update weekly stats
//     updatePeriodStats('weekly', trackingData.weekly);
    
//     // Update monthly stats
//     updatePeriodStats('monthly', trackingData.monthly);
//   });
// }

// // Update stats for a specific time period (daily, weekly, monthly)
// function updatePeriodStats(period, periodData, userSettings = null) {
//   let data = {};
  
//   // Get the current period key
//   const now = new Date();
//   let periodKey;
  
//   if (period === 'daily') {
//     periodKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
//   } else if (period === 'weekly') {
//     const weekNum = getWeekNumber(now);
//     periodKey = `${now.getFullYear()}-W${weekNum}`;
//   } else if (period === 'monthly') {
//     periodKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
//   }
  
//   // Get data for the current period
//   data = periodData[periodKey] || {};
  
//   // Calculate total time spent
//   let totalSeconds = 0;
//   Object.values(data).forEach(seconds => {
//     totalSeconds += seconds;
//   });
  
//   // Update total time display
//   const totalTimeElement = document.getElementById(`${period}-total`);
//   totalTimeElement.textContent = formatTime(totalSeconds);
  
//   // Update progress bar (only for daily)
//   if (period === 'daily' && userSettings) {
//     const goalSeconds = userSettings.streakGoalMinutes * 60;
//     const progressPercent = Math.min(100, (totalSeconds / goalSeconds) * 100);
    
//     document.getElementById(`${period}-progress`).style.width = `${progressPercent}%`;
//     document.getElementById(`${period}-progress-text`).textContent = `${Math.round(progressPercent)}%`;
//   }
  
//   // Update app breakdown
//   const breakdownElement = document.getElementById(`${period}-breakdown`);
//   breakdownElement.innerHTML = '';
  
//   // Sort apps by time spent (descending)
//   const sortedApps = Object.entries(data)
//     .sort((a, b) => b[1] - a[1])
//     .map(([app, seconds]) => {
//       return { app, seconds };
//     });
  
//   sortedApps.forEach(({ app, seconds }) => {
//     const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
    
//     const appElement = document.createElement('div');
//     appElement.className = 'app-item';
//     appElement.innerHTML = `
//       <div class="app-info">
//         <div class="app-name">${app}</div>
//         <div class="app-time">${formatTime(seconds)}</div>
//       </div>
//       <div class="app-progress">
//         <div class="app-progress-bar" style="width: ${percentage}%"></div>
//       </div>
//     `;
    
//     breakdownElement.appendChild(appElement);
//   });
  
//   // If no data, show message
//   if (sortedApps.length === 0) {
//     const noDataElement = document.createElement('div');
//     noDataElement.className = 'no-data';
//     noDataElement.textContent = `No ${period} data yet`;
//     breakdownElement.appendChild(noDataElement);
//   }
// }

// // Format seconds into hours and minutes
// function formatTime(seconds) {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
  
//   if (hours > 0) {
//     return `${hours}h ${minutes}m`;
//   } else {
//     return `${minutes}m`;
//   }
// }

// // Helper function to get the week number
// function getWeekNumber(date) {
//   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
//   const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
//   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
// }









// // Enhanced popup.js with persistent settings fixes
// document.addEventListener('DOMContentLoaded', function() {
//   // Load tracking data and populate UI immediately
//   updateUI();
  
//   // Set up tab navigation
//   const tabButtons = document.querySelectorAll('.tab-btn');
//   tabButtons.forEach(button => {
//     button.addEventListener('click', () => {
//       // Remove active class from all tabs
//       tabButtons.forEach(btn => btn.classList.remove('active'));
//       document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
//       // Add active class to clicked tab
//       button.classList.add('active');
//       const tabId = `${button.dataset.period}-content`;
//       document.getElementById(tabId).classList.add('active');
//     });
//   });
  
//   // Set up streak goal input with enhanced persistence
//   const streakGoalInput = document.getElementById('streakGoal');
//   streakGoalInput.addEventListener('change', () => {
//     const newGoal = parseInt(streakGoalInput.value, 10);
//     if (newGoal > 0 && newGoal <= 1440) { // Validate input (max 24 hours)
//       saveUserSettings({ streakGoalMinutes: newGoal });
//     } else {
//       // Reset to previous valid value
//       chrome.storage.local.get(['userSettings'], (result) => {
//         const settings = result.userSettings || { streakGoalMinutes: 40 };
//         streakGoalInput.value = settings.streakGoalMinutes;
//       });
//     }
//   });
  
//   // Set up tracking toggle with enhanced persistence
//   const trackingToggle = document.getElementById('trackingToggle');
//   trackingToggle.addEventListener('change', () => {
//     const isChecked = trackingToggle.checked;
//     saveUserSettings({ trackingEnabled: isChecked });
    
//     // Notify background script about the change
//     chrome.runtime.sendMessage({
//       action: 'updateTrackingStatus',
//       isEnabled: isChecked
//     });
//   });
// });

// // Function to save user settings with proper callback handling
// function saveUserSettings(newSettings) {
//   chrome.storage.local.get(['userSettings'], (result) => {
//     const currentSettings = result.userSettings || {
//       streakGoalMinutes: 40,
//       trackingEnabled: true
//     };
    
//     // Update settings with new values
//     const updatedSettings = { ...currentSettings, ...newSettings };
    
//     // Save to storage and ensure it completes
//     chrome.storage.local.set({ userSettings: updatedSettings }, () => {
//       console.log('Settings saved successfully:', updatedSettings);
//       // Only update UI after confirming the save was successful
//       updateUI();
      
//       // Check for any chrome.runtime errors
//       if (chrome.runtime.lastError) {
//         console.error('Error saving settings:', chrome.runtime.lastError);
//       }
//     });
//   });
// }

// // Improved updateUI function
// function updateUI() {
//   chrome.storage.local.get(['trackingData', 'userSettings'], (result) => {
//     // Default values if missing
//     const trackingData = result.trackingData || {
//       daily: {},
//       weekly: {},
//       monthly: {},
//       streaks: { current: 0 }
//     };
    
//     const userSettings = result.userSettings || {
//       streakGoalMinutes: 40,
//       trackingEnabled: true
//     };
    
//     console.log('Current user settings:', userSettings);
    
//     // Update streak counter
//     document.getElementById('streakCounter').textContent = trackingData.streaks.current;
    
//     // Update streak goal input - ensure we always have a valid value
//     const streakGoal = parseInt(userSettings.streakGoalMinutes, 10) || 40;
//     document.getElementById('streakGoal').value = streakGoal;
    
//     // Update tracking toggle - ensure we have a valid boolean
//     const trackingToggle = document.getElementById('trackingToggle');
//     trackingToggle.checked = userSettings.trackingEnabled !== false;
    
//     // Update daily stats
//     updatePeriodStats('daily', trackingData.daily, userSettings);
    
//     // Update weekly stats
//     updatePeriodStats('weekly', trackingData.weekly);
    
//     // Update monthly stats
//     updatePeriodStats('monthly', trackingData.monthly);
//   });
// }

// // Update stats for a specific time period (daily, weekly, monthly)
// function updatePeriodStats(period, periodData, userSettings = null) {
//   let data = {};
  
//   // Get the current period key
//   const now = new Date();
//   let periodKey;
  
//   if (period === 'daily') {
//     periodKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
//   } else if (period === 'weekly') {
//     const weekNum = getWeekNumber(now);
//     periodKey = `${now.getFullYear()}-W${weekNum}`;
//   } else if (period === 'monthly') {
//     periodKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
//   }
  
//   // Get data for the current period
//   data = periodData[periodKey] || {};
  
//   // Calculate total time spent
//   let totalSeconds = 0;
//   Object.values(data).forEach(seconds => {
//     totalSeconds += seconds;
//   });
  
//   // Update total time display
//   const totalTimeElement = document.getElementById(`${period}-total`);
//   totalTimeElement.textContent = formatTime(totalSeconds);
  
//   // Update progress bar (only for daily)
//   if (period === 'daily' && userSettings) {
//     const goalSeconds = (userSettings.streakGoalMinutes || 40) * 60;
//     const progressPercent = Math.min(100, (totalSeconds / goalSeconds) * 100);
    
//     document.getElementById(`${period}-progress`).style.width = `${progressPercent}%`;
//     document.getElementById(`${period}-progress-text`).textContent = `${Math.round(progressPercent)}%`;
//   }
  
//   // Update app breakdown
//   const breakdownElement = document.getElementById(`${period}-breakdown`);
//   breakdownElement.innerHTML = '';
  
//   // Sort apps by time spent (descending)
//   const sortedApps = Object.entries(data)
//     .sort((a, b) => b[1] - a[1])
//     .map(([app, seconds]) => {
//       return { app, seconds };
//     });
  
//   sortedApps.forEach(({ app, seconds }) => {
//     const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
    
//     const appElement = document.createElement('div');
//     appElement.className = 'app-item';
//     appElement.innerHTML = `
//       <div class="app-info">
//         <div class="app-name">${app}</div>
//         <div class="app-time">${formatTime(seconds)}</div>
//       </div>
//       <div class="app-progress">
//         <div class="app-progress-bar" style="width: ${percentage}%"></div>
//       </div>
//     `;
    
//     breakdownElement.appendChild(appElement);
//   });
  
//   // If no data, show message
//   if (sortedApps.length === 0) {
//     const noDataElement = document.createElement('div');
//     noDataElement.className = 'no-data';
//     noDataElement.textContent = `No ${period} data yet`;
//     breakdownElement.appendChild(noDataElement);
//   }
// }

// // Format seconds into hours and minutes
// function formatTime(seconds) {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
  
//   if (hours > 0) {
//     return `${hours}h ${minutes}m`;
//   } else {
//     return `${minutes}m`;
//   }
// }

// // Helper function to get the week number
// function getWeekNumber(date) {
//   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
//   const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
//   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
// }
























// // Enhanced popup.js with persistent settings fixes and reset functionality
// document.addEventListener('DOMContentLoaded', function() {
//   // Load tracking data and populate UI immediately
//   updateUI();
  
//   // Set up tab navigation
//   const tabButtons = document.querySelectorAll('.tab-btn');
//   tabButtons.forEach(button => {
//     button.addEventListener('click', () => {
//       // Remove active class from all tabs
//       tabButtons.forEach(btn => btn.classList.remove('active'));
//       document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
//       // Add active class to clicked tab
//       button.classList.add('active');
//       const tabId = `${button.dataset.period}-content`;
//       document.getElementById(tabId).classList.add('active');
//     });
//   });
  
//   // Set up streak goal input with enhanced persistence
//   const streakGoalInput = document.getElementById('streakGoal');
//   streakGoalInput.addEventListener('change', () => {
//     const newGoal = parseInt(streakGoalInput.value, 10);
//     if (newGoal > 0 && newGoal <= 1440) { // Validate input (max 24 hours)
//       saveUserSettings({ streakGoalMinutes: newGoal });
//     } else {
//       // Reset to previous valid value
//       chrome.storage.local.get(['userSettings'], (result) => {
//         const settings = result.userSettings || { streakGoalMinutes: 40 };
//         streakGoalInput.value = settings.streakGoalMinutes;
//       });
//     }
//   });
  
//   // Set up tracking toggle with enhanced persistence
//   const trackingToggle = document.getElementById('trackingToggle');
//   trackingToggle.addEventListener('change', () => {
//     const isChecked = trackingToggle.checked;
//     saveUserSettings({ trackingEnabled: isChecked });
    
//     // Notify background script about the change
//     chrome.runtime.sendMessage({
//       action: 'updateTrackingStatus',
//       isEnabled: isChecked
//     });
//   });

//   // Set up reset button
//   const resetButton = document.getElementById('resetButton');
//   if (resetButton) {
//     resetButton.addEventListener('click', resetAllData);
//   } else {
//     console.warn('Reset button not found in the DOM. Make sure to add it to your HTML.');
//   }
// });

// // Reset all tracking data function
// function resetAllData() {
//   if (confirm('Are you sure you want to reset all tracking data? This will reset your streak and all usage statistics.')) {
//     // Reset tracking data
//     const emptyTrackingData = {
//       daily: {},
//       weekly: {},
//       monthly: {},
//       streaks: { current: 0 }
//     };
    
//     // Save empty tracking data to storage
//     chrome.storage.local.set({ trackingData: emptyTrackingData }, () => {
//       console.log('All tracking data has been reset');
      
//       // Reset user settings to defaults (but keep the goal value)
//       chrome.storage.local.get(['userSettings'], (result) => {
//         const currentSettings = result.userSettings || {};
//         const defaultSettings = {
//           streakGoalMinutes: currentSettings.streakGoalMinutes || 40,
//           trackingEnabled: true
//         };
        
//         chrome.storage.local.set({ userSettings: defaultSettings }, () => {
//           console.log('Settings reset to defaults');
          
//           // Notify background script about the reset
//           chrome.runtime.sendMessage({
//             action: 'resetData'
//           });
          
//           // Refresh the UI to show reset data
//           updateUI();
//         });
//       });
//     });
//   }
// }

// // Function to save user settings with proper callback handling
// function saveUserSettings(newSettings) {
//   chrome.storage.local.get(['userSettings'], (result) => {
//     const currentSettings = result.userSettings || {
//       streakGoalMinutes: 40,
//       trackingEnabled: true
//     };
    
//     // Update settings with new values
//     const updatedSettings = { ...currentSettings, ...newSettings };
    
//     // Save to storage and ensure it completes
//     chrome.storage.local.set({ userSettings: updatedSettings }, () => {
//       console.log('Settings saved successfully:', updatedSettings);
//       // Only update UI after confirming the save was successful
//       updateUI();
      
//       // Check for any chrome.runtime errors
//       if (chrome.runtime.lastError) {
//         console.error('Error saving settings:', chrome.runtime.lastError);
//       }
//     });
//   });
// }

// // Improved updateUI function
// function updateUI() {
//   chrome.storage.local.get(['trackingData', 'userSettings'], (result) => {
//     // Default values if missing
//     const trackingData = result.trackingData || {
//       daily: {},
//       weekly: {},
//       monthly: {},
//       streaks: { current: 0 }
//     };
    
//     const userSettings = result.userSettings || {
//       streakGoalMinutes: 40,
//       trackingEnabled: true
//     };
    
//     console.log('Current user settings:', userSettings);
    
//     // Update streak counter
//     document.getElementById('streakCounter').textContent = trackingData.streaks.current;
    
//     // Update streak goal input - ensure we always have a valid value
//     const streakGoal = parseInt(userSettings.streakGoalMinutes, 10) || 40;
//     document.getElementById('streakGoal').value = streakGoal;
    
//     // Update tracking toggle - ensure we have a valid boolean
//     const trackingToggle = document.getElementById('trackingToggle');
//     trackingToggle.checked = userSettings.trackingEnabled !== false;
    
//     // Update daily stats
//     updatePeriodStats('daily', trackingData.daily, userSettings);
    
//     // Update weekly stats
//     updatePeriodStats('weekly', trackingData.weekly);
    
//     // Update monthly stats
//     updatePeriodStats('monthly', trackingData.monthly);
//   });
// }

// // Update stats for a specific time period (daily, weekly, monthly)
// function updatePeriodStats(period, periodData, userSettings = null) {
//   let data = {};
  
//   // Get the current period key
//   const now = new Date();
//   let periodKey;
  
//   if (period === 'daily') {
//     periodKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
//   } else if (period === 'weekly') {
//     const weekNum = getWeekNumber(now);
//     periodKey = `${now.getFullYear()}-W${weekNum}`;
//   } else if (period === 'monthly') {
//     periodKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
//   }
  
//   // Get data for the current period
//   data = periodData[periodKey] || {};
  
//   // Calculate total time spent
//   let totalSeconds = 0;
//   Object.values(data).forEach(seconds => {
//     totalSeconds += seconds;
//   });
  
//   // Update total time display
//   const totalTimeElement = document.getElementById(`${period}-total`);
//   totalTimeElement.textContent = formatTime(totalSeconds);
  
//   // Update progress bar (only for daily)
//   if (period === 'daily' && userSettings) {
//     const goalSeconds = (userSettings.streakGoalMinutes || 40) * 60;
//     const progressPercent = Math.min(100, (totalSeconds / goalSeconds) * 100);
    
//     document.getElementById(`${period}-progress`).style.width = `${progressPercent}%`;
//     document.getElementById(`${period}-progress-text`).textContent = `${Math.round(progressPercent)}%`;
//   }
  
//   // Update app breakdown
//   const breakdownElement = document.getElementById(`${period}-breakdown`);
//   breakdownElement.innerHTML = '';
  
//   // Sort apps by time spent (descending)
//   const sortedApps = Object.entries(data)
//     .sort((a, b) => b[1] - a[1])
//     .map(([app, seconds]) => {
//       return { app, seconds };
//     });
  
//   sortedApps.forEach(({ app, seconds }) => {
//     const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
    
//     const appElement = document.createElement('div');
//     appElement.className = 'app-item';
//     appElement.innerHTML = `
//       <div class="app-info">
//         <div class="app-name">${app}</div>
//         <div class="app-time">${formatTime(seconds)}</div>
//       </div>
//       <div class="app-progress">
//         <div class="app-progress-bar" style="width: ${percentage}%"></div>
//       </div>
//     `;
    
//     breakdownElement.appendChild(appElement);
//   });
  
//   // If no data, show message
//   if (sortedApps.length === 0) {
//     const noDataElement = document.createElement('div');
//     noDataElement.className = 'no-data';
//     noDataElement.textContent = `No ${period} data yet`;
//     breakdownElement.appendChild(noDataElement);
//   }
// }

// // Format seconds into hours and minutes
// function formatTime(seconds) {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
  
//   if (hours > 0) {
//     return `${hours}h ${minutes}m`;
//   } else {
//     return `${minutes}m`;
//   }
// }

// // Helper function to get the week number
// function getWeekNumber(date) {
//   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
//   const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
//   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
// }

















// popup.js - This script handles the popup UI functionality

document.addEventListener('DOMContentLoaded', function() {
  // Load tracking data and populate UI immediately
  updateUI();
  
  // Set up tab navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab
      button.classList.add('active');
      const tabId = `${button.dataset.period}-content`;
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Set up streak goal input with enhanced persistence
  const streakGoalInput = document.getElementById('streakGoal');
  streakGoalInput.addEventListener('change', () => {
    const newGoal = parseInt(streakGoalInput.value, 10);
    if (newGoal > 0 && newGoal <= 1440) { // Validate input (max 24 hours)
      saveUserSettings({ streakGoalMinutes: newGoal });
    } else {
      // Reset to previous valid value
      chrome.storage.local.get(['userSettings'], (result) => {
        const settings = result.userSettings || { streakGoalMinutes: 40 };
        streakGoalInput.value = settings.streakGoalMinutes;
      });
    }
  });
  
  // Set up tracking toggle with enhanced persistence
  const trackingToggle = document.getElementById('trackingToggle');
  trackingToggle.addEventListener('change', () => {
    const isChecked = trackingToggle.checked;
    saveUserSettings({ trackingEnabled: isChecked });
    
    // Notify background script about the change
    chrome.runtime.sendMessage({
      action: 'updateTrackingStatus',
      isEnabled: isChecked
    });
  });

  // Set up reset button
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', resetAllData);
  } else {
    console.warn('Reset button not found in the DOM. Make sure to add it to your HTML.');
  }
  
  // Set up refresh interval - update data every 5 seconds
  // This ensures real-time updates without requiring page refresh
  setInterval(updateUI, 5000);
});

// Reset all tracking data function
function resetAllData() {
  if (confirm('Are you sure you want to reset all tracking data? This will reset your streak and all usage statistics.')) {
    // Reset tracking data
    const emptyTrackingData = {
      daily: {},
      weekly: {},
      monthly: {},
      streaks: { current: 0, best: 0, lastActiveDate: null }
    };
    
    // Save empty tracking data to storage
    chrome.storage.local.set({ trackingData: emptyTrackingData }, () => {
      console.log('All tracking data has been reset');
      
      // Reset user settings to defaults (but keep the goal value)
      chrome.storage.local.get(['userSettings'], (result) => {
        const currentSettings = result.userSettings || {};
        const defaultSettings = {
          streakGoalMinutes: currentSettings.streakGoalMinutes || 40,
          trackingEnabled: true
        };
        
        chrome.storage.local.set({ userSettings: defaultSettings }, () => {
          console.log('Settings reset to defaults');
          
          // Notify background script about the reset
          chrome.runtime.sendMessage({
            action: 'resetData'
          });
          
          // Refresh the UI to show reset data
          updateUI();
        });
      });
    });
  }
}

// Function to save user settings with proper callback handling
function saveUserSettings(newSettings) {
  chrome.storage.local.get(['userSettings'], (result) => {
    const currentSettings = result.userSettings || {
      streakGoalMinutes: 40,
      trackingEnabled: true
    };
    
    // Update settings with new values
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    // Save to storage and ensure it completes
    chrome.storage.local.set({ userSettings: updatedSettings }, () => {
      console.log('Settings saved successfully:', updatedSettings);
      // Only update UI after confirming the save was successful
      updateUI();
      
      // Check for any chrome.runtime errors
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
      }
    });
  });
}

// Improved updateUI function
function updateUI() {
  chrome.storage.local.get(['trackingData', 'userSettings'], (result) => {
    // Default values if missing
    const trackingData = result.trackingData || {
      daily: {},
      weekly: {},
      monthly: {},
      streaks: { current: 0, best: 0, lastActiveDate: null }
    };
    
    const userSettings = result.userSettings || {
      streakGoalMinutes: 40,
      trackingEnabled: true
    };
    
    console.log('Current user settings:', userSettings);
    
    // Update streak counter
    document.getElementById('streakCounter').textContent = trackingData.streaks.current;
    
    // Update streak goal input - ensure we always have a valid value
    const streakGoal = parseInt(userSettings.streakGoalMinutes, 10) || 40;
    document.getElementById('streakGoal').value = streakGoal;
    
    // Update tracking toggle - ensure we have a valid boolean
    const trackingToggle = document.getElementById('trackingToggle');
    trackingToggle.checked = userSettings.trackingEnabled !== false;
    
    // Update daily stats
    updatePeriodStats('daily', trackingData.daily, userSettings);
    
    // Update weekly stats
    updatePeriodStats('weekly', trackingData.weekly);
    
    // Update monthly stats
    updatePeriodStats('monthly', trackingData.monthly);
  });
}

// Update stats for a specific time period (daily, weekly, monthly)
function updatePeriodStats(period, periodData, userSettings = null) {
  let data = {};
  
  // Get the current period key
  const now = new Date();
  let periodKey;
  
  if (period === 'daily') {
    periodKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
  } else if (period === 'weekly') {
    const weekNum = getWeekNumber(now);
    periodKey = `${now.getFullYear()}-W${weekNum}`;
  } else if (period === 'monthly') {
    periodKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  }
  
  // Get data for the current period
  data = periodData[periodKey] || {};
  
  // Calculate total time spent
  let totalSeconds = calculateTotalSeconds(data);
  
  // Update total time display
  const totalTimeElement = document.getElementById(`${period}-total`);
  totalTimeElement.textContent = formatTime(totalSeconds);
  
  // Update progress bar (only for daily)
  if (period === 'daily' && userSettings) {
    const goalSeconds = (userSettings.streakGoalMinutes || 40) * 60;
    const progressPercent = Math.min(100, (totalSeconds / goalSeconds) * 100);
    
    document.getElementById(`${period}-progress`).style.width = `${progressPercent}%`;
    document.getElementById(`${period}-progress-text`).textContent = `${Math.round(progressPercent)}%`;
  }
  
  // Update app breakdown
  const breakdownElement = document.getElementById(`${period}-breakdown`);
  breakdownElement.innerHTML = '';
  
  // Sort apps by time spent (descending)
  const sortedApps = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .map(([app, seconds]) => {
      return { app, seconds };
    });
  
  sortedApps.forEach(({ app, seconds }) => {
    const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
    
    const appElement = document.createElement('div');
    appElement.className = 'app-item';
    
    // Generate a color based on the app name
    const color = getAppColor(app);
    
    appElement.innerHTML = `
      <div class="app-info">
        <div class="app-name-container">
          <div class="app-color" style="background-color: ${color}"></div>
          <div class="app-name">${app}</div>
        </div>
        <div class="app-time">${formatTime(seconds)}</div>
      </div>
      <div class="app-progress">
        <div class="app-progress-bar" style="background-color: ${color}; width: ${percentage}%"></div>
      </div>
    `;
    
    breakdownElement.appendChild(appElement);
  });
  
  // If no data, show message
  if (sortedApps.length === 0) {
    const noDataElement = document.createElement('div');
    noDataElement.className = 'no-data';
    noDataElement.textContent = `No ${period === 'daily' ? 'learning activity recorded yet today' : `${period} data yet`}`;
    breakdownElement.appendChild(noDataElement);
  }
}

// Helper function to calculate total seconds from data object
function calculateTotalSeconds(data) {
  let total = 0;
  for (const app in data) {
    total += data[app];
  }
  return total;
}

// Format seconds into hours and minutes
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Helper function to get the week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Helper function to generate a consistent color based on app name
function getAppColor(appName) {
  const colors = {
    'YouTube': '#FF0000',
    'Udemy': '#A435F0',
    'Coursera': '#0056D2',
    'edX': '#02262B',
    'Khan Academy': '#14BF96',
    'Skillshare': '#FF9E2C',
    'Pluralsight': '#F15B2A',
    'LinkedIn Learning': '#0077B5'
  };
  
  return colors[appName] || '#7E57C2'; // Default purple if no color defined
}