import { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TimerScreen() {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [taskName, setTaskName] = useState("");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (isTimerRunning) {
      timerInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setElapsedTime(0);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className={` flex-1 p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className={`my-5 `}>
          <TextInput
            className={`text-lg p-4 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
            placeholder="What are you working on?"
            placeholderTextColor={isDark ? "#888888" : "#9CA3AF"}
            value={taskName}
            onChangeText={setTaskName}
          />
        </View>
        
        <View className={`flex-1 justify-center items-center`}>
          <Text className={`text-6xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(elapsedTime)}
          </Text>
        </View>
        
        <View className={`flex-row justify-center items-center mb-10`}>
          <TouchableOpacity 
            className={`w-16 h-16 rounded-full justify-center items-center mx-2.5 bg-red-500`}
            onPress={resetTimer}
            disabled={!elapsedTime}
          >
            <Ionicons 
              name="refresh-outline" 
              size={24} 
              color={elapsedTime ? "#fff" : "#888888"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`w-16 h-16 rounded-full justify-center items-center mx-2.5 ${isTimerRunning ? 'bg-amber-500' : 'bg-indigo-500'}`}
            onPress={toggleTimer}
          >
            <Ionicons 
              name={isTimerRunning ? "pause" : "play"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
