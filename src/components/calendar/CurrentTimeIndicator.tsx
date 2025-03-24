import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

/**
 * CurrentTimeIndicator component displays a horizontal line at the current time position
 */
const CurrentTimeIndicator: React.FC = () => {
  const [currentMinutes, setCurrentMinutes] = useState(getMinutesSinceMidnight());
  
  // Update position every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(getMinutesSinceMidnight());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Calculate minutes since midnight to position the indicator
  function getMinutesSinceMidnight() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
  
  // Convert minutes to pixels (60px per hour)
  const topPosition = (currentMinutes / 60) * 60;

  return (
    <View 
      className="absolute left-0 right-0 flex-row items-center" 
      style={{
        top: topPosition,
        zIndex: 2
      }}
      accessibilityLabel="Current time indicator"
    >
      <View className="w-2 h-2 rounded-full bg-red-500 ml-2" />
      <View className="flex-1 h-[1px] bg-red-500" />
    </View>
  );
};

export default CurrentTimeIndicator;