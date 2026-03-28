import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import * as Notifications from "expo-notifications";
import { useAuth } from "./hooks/useAuth";
import { trpc } from "./lib/trpc";

// Screens
import LoginScreen from "./screens/LoginScreen";
import EventListScreen from "./screens/EventListScreen";
import AttendeeScreen from "./screens/AttendeeScreen";
import TranscriptScreen from "./screens/TranscriptScreen";
import QAScreen from "./screens/QAScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Root Navigation Stack
 * Handles authentication and main app navigation
 */
function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Show splash screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="MainApp" component={MainAppNavigator} />
      )}
    </Stack.Navigator>
  );
}

/**
 * Main App Navigator
 * Tab-based navigation for authenticated users
 */
function MainAppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#FF1744",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventListScreen}
        options={{
          title: "Events",
          tabBarLabel: "Events",
        }}
      />
      <Tab.Screen
        name="Attendee"
        component={AttendeeScreen}
        options={{
          title: "Live Event",
          tabBarLabel: "Live",
        }}
      />
      <Tab.Screen
        name="Transcript"
        component={TranscriptScreen}
        options={{
          title: "Transcript",
          tabBarLabel: "Transcript",
        }}
      />
      <Tab.Screen
        name="QA"
        component={QAScreen}
        options={{
          title: "Q&A",
          tabBarLabel: "Q&A",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Main App Component
 * Sets up tRPC, React Query, and Navigation
 */
export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/trpc",
        transformer: superjson,
        fetch(input, init) {
          return fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        },
      }),
    ],
  });

  // Set up push notifications
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Handle notification tap
        console.log("Notification tapped:", response);
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
