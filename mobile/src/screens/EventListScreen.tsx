import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { trpc } from "../lib/trpc";

export default function EventListScreen({ navigation }: any) {
  const { data: events, isLoading, error } = trpc.events.list.useQuery();

  const handleEventPress = (eventId: string) => {
    navigation.navigate("Attendee", { eventId });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF1744" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>Failed to load events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => handleEventPress(item.id)}
          >
            <Text style={styles.eventName}>{item.name}</Text>
            <Text style={styles.eventDate}>
              {new Date(item.startTime).toLocaleDateString()}
            </Text>
            <Text style={styles.eventStatus}>{item.status}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF1744",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  eventStatus: {
    fontSize: 12,
    color: "#FF1744",
    fontWeight: "bold",
  },
  error: {
    color: "#FF1744",
    fontSize: 16,
  },
});
