import { client, DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Button, Surface, Text } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>()

  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      )
      console.log(response)
      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!user) return;

    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;

    const unsubscribe = client.subscribe(habitsChannel, response => {
      const { events } = response;

      if (
        events.includes("databases.*.collections.*.documents.*.create") ||
        events.includes("databases.*.collections.*.documents.*.update") ||
        events.includes("databases.*.collections.*.documents.*.delete")
      ) {
        fetchHabits();
      }
    });

    fetchHabits();

    return () => {
      unsubscribe(); // important to clean up
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);



  return (
    <ScrollView
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Today&apos;s Habits
        </Text>
        <Button mode="text" onPress={signOut} icon={"logout"}>Sign Out</Button>
      </View>

      {habits?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No Habits yet. Add your first Habit!</Text>
        </View>
      ) : (
        habits?.map(({
          title,
          description,
          streak_count,
          last_completed,
          frequency,
          created_at },
          key) =>
          <Surface key={key} style={styles.card} elevation={0}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardDescription}>{description}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={18} color={"#ff9800"} />
                  <Text style={styles.streakText}>{streak_count} day streak</Text>
                </View>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyText}>{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</Text>
                </View>
              </View>
              <Text>{last_completed}</Text>
              <Text>{created_at}</Text>
            </View>
          </Surface>
        )
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: "#fff5fa",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: "#22223b",
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    color: "#6c6c80",
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: 'bold',
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: '#ede7f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666666',
  }
})