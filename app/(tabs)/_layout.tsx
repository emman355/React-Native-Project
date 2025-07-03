import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "red", headerTitleAlign: 'center' }}>
      <FontAwesome5 name="home" size={24} color="black" />
      <Tabs.Screen name="index" options={{
        title: "Home", tabBarIcon: ({ color, focused }) => focused ? <FontAwesome5 name="home" size={24} color={color} /> : <Feather name="home" size={24} color={color} />
      }} />
      <Tabs.Screen name="login" options={{ title: "Login" }} />
    </Tabs>
  )

}
