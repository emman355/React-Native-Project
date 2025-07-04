import { client, COMPLETIONS_COLLECTION_ID, DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletions } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ID } from "appwrite";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Button, Surface, Text } from "react-native-paper";
import Reanimated from 'react-native-reanimated';



export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>()
  const [completedHabits, setCompletedHabits] = useState<string[]>()

  const swipeableRefs = useRef<{ [key: string]: any | null }>({});


  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      )

      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.log(error)
    }
  }

  const fetchTodayHabitsCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0)
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ]
      )
      const completions = response.documents as HabitCompletions[]
      setCompletedHabits(completions.map((c) => c.habit_id));
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!user) return;

    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const habitDocuments = "databases.*.collections.*.documents.*"

    const unsubscribeHabits = client.subscribe(habitsChannel, response => {
      const { events } = response;
      if (
        events.includes(`${habitDocuments}.create`) ||
        events.includes(`${habitDocuments}.update`) ||
        events.includes(`${habitDocuments}.delete`)
      ) {
        fetchHabits();
      }
    });

    const habitsCompletionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
    const habitCompletiondocuments = "databases.*.collections.*.documents.*"

    const unsubscribeCompletions = client.subscribe(habitsCompletionsChannel, response => {
      const { events } = response;
      if (
        events.includes(`${habitCompletiondocuments}.create`)
      ) {
        fetchTodayHabitsCompletions();
      }
    });

    fetchHabits();
    fetchTodayHabitsCompletions();

    return () => {
      unsubscribeHabits(); // important to clean up
      unsubscribeCompletions(); // important to clean up
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDeleteHabit = async (id: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        id,
      )
    } catch (error) {
      console.log(error)
    }
  }

  const handleCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    try {
      const currentDate = new Date().toISOString()
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        {
          habit_id: id,
          user_id: user.$id,
          completed_at: currentDate,
        }
      )

      const habit = habits?.find((h) => h.$id === id)
      if (!habit) return;

      await databases.updateDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        id,
        {
          streak_count: habit.streak_count + 1,
          last_completed: currentDate,
        }
      )
    } catch (error) {
      console.log(error)
    }
  }

  const rightAction = (habitId: string) => (
    <Reanimated.View style={styles.rightActionStyle}>
      {!isHabitCompleted(habitId) ? <MaterialCommunityIcons name="check-circle-outline" size={32} color={"#fff"} /> : <Text style={{ color: '#fff' }}>Completed!</Text>}
    </Reanimated.View>
  );

  const leftAction = (habitId: string) => (
    <Reanimated.View style={styles.leftActionStyle}>
      {<MaterialCommunityIcons name="trash-can-outline" size={32} color={"#fff"} />}
    </Reanimated.View>
  );

  const isHabitCompleted = (habitId: string) => completedHabits?.includes(habitId)


  return (
    <View
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No Habits yet. Add your first Habit!</Text>
          </View>
        ) : (
          habits?.map(({
            $id,
            title,
            description,
            streak_count,
            frequency,
          },
            key) =>
            <Swipeable key={key}
              ref={(ref) => {
                swipeableRefs.current[$id] = ref;
              }}
              containerStyle={styles.swipeable}
              friction={2}
              overshootLeft={false}
              overshootRight={false}
              enableTrackpadTwoFingerGesture
              renderRightActions={() => rightAction($id)}
              renderLeftActions={() => leftAction($id)}
              onSwipeableOpen={(direction) => {
                if (direction === "right") {
                  handleDeleteHabit($id);
                } else if (direction === "left") {
                  handleCompleteHabit($id);
                }
                swipeableRefs.current[$id]?.close()
              }}
            >
              <Surface style={[styles.card, isHabitCompleted($id) && styles.cardCompleted]} elevation={0}>
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
                </View>
              </Surface>
            </Swipeable>
          )
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
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
  },
  rightAction: {},
  swipeable: {
    backgroundColor: '#f5f5f5',
  },
  cardCompleted: {
    opacity: 0.6
  },
  rightActionStyle: {
    width: 50,
    height: 'auto',
    justifyContent: 'center',
    borderRadius: 18,
    marginBottom: 16,
    marginTop: 2,
    flex: 1,
    paddingRight: 16,
    backgroundColor: 'rgb(89, 197, 92)',
    alignItems: 'flex-end'

  },
  leftActionStyle: {
    width: 50,
    height: 'auto',
    backgroundColor: 'rgb(243, 62, 59)',
    justifyContent: 'center',
    borderRadius: 18,
    marginBottom: 16,
    marginTop: 2,
    flex: 1,
    paddingLeft: 16,
    alignItems: 'flex-start'
  }
})