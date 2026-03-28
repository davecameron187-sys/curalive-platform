import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function TranscriptScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.title}>Transcript</Text>
        <Text style={styles.subtitle}>Live transcript will appear here</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
  },
});
