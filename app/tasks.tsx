import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Task = {
  id: string;
  name: string;
  totalTime: number; // in seconds
  projectId?: string;
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", name: "Design UI Mockups", totalTime: 7200 },
    { id: "2", name: "Code Timer Functionality", totalTime: 10800 },
    { id: "3", name: "Fix Navigation Issue", totalTime: 3600 },
    { id: "4", name: "Research SQLite Implementation", totalTime: 5400 },
  ]);
  const [newTask, setNewTask] = useState("");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        name: newTask.trim(),
        totalTime: 0,
      };
      setTasks([...tasks, task]);
      setNewTask("");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <View className={`flex-1 p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <View className={`flex-row mb-5`}>
        <TextInput
          className={`flex-1 h-[50px] rounded-lg px-4 text-base ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add a new task"
          placeholderTextColor={isDark ? "#888888" : "#9CA3AF"}
        />
        <TouchableOpacity 
          className={`w-[50px] h-[50px] rounded-lg ml-2 bg-indigo-500 justify-center items-center`}
          onPress={addTask}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        className={`flex-1`}
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className={`flex-row items-center p-4 rounded-lg mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <View className={`flex-1`}>
              <Text className={`text-[17px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.name}
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatTime(item.totalTime)}
              </Text>
            </View>
            <TouchableOpacity className={`w-10 h-10 rounded-full bg-indigo-500 justify-center items-center`}>
              <Ionicons name="play" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className={`items-center justify-center py-10`}>
            <Text className={`text-base text-center ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              No tasks yet. Add your first task above!
            </Text>
          </View>
        }
      />
    </View>
  );
}