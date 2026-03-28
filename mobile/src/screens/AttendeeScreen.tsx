import React, { useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { trpc } from "../lib/trpc";

export default function AttendeeScreen({ route }: any) {
  const eventId = route?.params?.eventId;

  const { data: event, isLoading, error } = trpc.events.getById.useQuery(
    { eventId: eventId || "" },
    { enabled: !!eventId }
  );

  if (!eventId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>No event selected</Text>
      </View>
    );
  }

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
        <Text style={styles.error}>Failed to load event</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eventName}>{event?.name}</Text>
        <Text style={styles.eventStatus}>{event?.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        <View style={styles.detail}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(event?.startTime).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Attendees:</Text>
          <Text style={styles.value}>{event?.attendeeCount || 0}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sentiment</Text>
        <View style={styles.sentimentBar}>
          <View
            style={[
              styles.sentimentFill,
              { width: `${event?.averageSentiment || 0}%` },
            ]}
          />
        </View>
        <Text style={styles.sentimentText}>
          {event?.averageSentiment || 0}% Positive
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Q&A</Text>
        <View style={styles.qaStats}>
          <View style={styles.qaStat}>
            <Text style={styles.qaNumber}>{event?.questionCount || 0}</Text>
            <Text style={styles.qaLabel}>Questions</Text>
          </View>
          <View style={styles.qaStat}>
            <Text style={styles.qaNumber}>{event?.approvedCount || 0}</Text>
            <Text style={styles.qaLabel}>Approved</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  eventName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  eventStatus: {
    fontSize: 14,
    color: "#FF1744",
    fontWeight: "bold",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    color: "#999",
    fontSize: 14,
  },
  value: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  sentimentBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  sentimentFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  sentimentText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "bold",
  },
  qaStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  qaStat: {
    alignItems: "center",
  },
  qaNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF1744",
    marginBottom: 4,
  },
  qaLabel: {
    fontSize: 12,
    color: "#999",
  },
  error: {
    color: "#FF1744",
    fontSize: 16,
  },
});
