import { client, COMPLETIONS_COLLECTION_ID, DATABASE_ID, databases, HABITS_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { Habit, HabitCompletions } from '@/types/database.type';
import { Query } from 'appwrite';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, Text } from 'react-native-paper';

export default function StreaksScreen() {
	const { user } = useAuth();
	const [habits, setHabits] = useState<Habit[]>([])
	const [completedHabits, setCompletedHabits] = useState<HabitCompletions[]>([])

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

	const fetchCompletions = async () => {
		try {
			const response = await databases.listDocuments(
				DATABASE_ID,
				COMPLETIONS_COLLECTION_ID,
				[
					Query.equal("user_id", user?.$id ?? ""),
				]
			)
			const completions = response.documents as HabitCompletions[]
			setCompletedHabits(completions);
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
				fetchCompletions();
			}
		});
		fetchHabits();
		fetchCompletions();

		return () => {
			unsubscribeHabits(); // important to clean up
			unsubscribeCompletions(); // important to clean up
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	interface StreakData {
		streak: number,
		bestStreak: number,
		total: number
	}

	const getStreakData = (habitId: string): StreakData => {
		const habitCompletions = completedHabits?.filter(
			(c) => c.habit_id === habitId
		).sort((a, b) =>
			new Date(a.completed_at).getTime() -
			new Date(a.completed_at).getTime()
		)

		if (habitCompletions?.length === 0) {
			return {
				streak: 0,
				bestStreak: 0,
				total: 0
			}
		}

		// build streak data
		let streak = 0;
		let bestStreak = 0;
		let total = habitCompletions.length;
		let lastDate: Date | null = null;
		let currentStreak = 0;

		habitCompletions?.forEach((c) => {
			const date = new Date(c.completed_at)
			if (lastDate) {
				const diff = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

				if (diff <= 1.5) {
					currentStreak += 1;
				} else {
					currentStreak = 1;
				}
			} else {
				currentStreak = 1;
			}
			if (currentStreak > bestStreak) bestStreak = currentStreak;
			streak = currentStreak;
			lastDate = date;
		})

		return {
			streak,
			bestStreak,
			total
		}
	}

	const habitStreaks = habits.map((habit) => {
		const {
			streak,
			bestStreak,
			total
		} = getStreakData(habit.$id)

		return {
			habit,
			streak,
			bestStreak,
			total
		}
	})

	const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak)

	const badgeStyles = [styles.badge1, styles.badge2, styles.badge3];
	return (
		<View style={styles.container}>
			<Text style={styles.title} variant='headlineSmall'>
				Habit Streaks!
			</Text>

			{
				rankedHabits.length > 0 && (
					<View style={styles.rankingContainer}>
						<Text style={styles.rankingTitle}>🥇 Top Streaks</Text>
						{rankedHabits.slice(0, 3).map(({ habit, bestStreak }, key) => (
							<View key={key} style={styles.rankingRow}>
								<View style={[styles.rankingBadge, badgeStyles[key]]}>
									<Text style={styles.rankingBadgeText}>{key + 1}</Text>
								</View>
								<Text style={styles.rankingBadgeHabit}>{habit.title}</Text>
								<Text style={styles.rankingBadgeStreak}>{bestStreak}</Text>
							</View>
						))}
					</View>
				)
			}

			{habits.length === 0 ?
				(
					<View style={styles.emptyState}>
						<Text style={styles.emptyStateText}>No Habits yet. Add your first Habit!</Text>
					</View>
				) :
				(
					<ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
						{rankedHabits.map(({ habit,
							streak,
							bestStreak,
							total }, key) => (
							<Card key={key} style={[styles.card, key === 0 && styles.firstCard]}>
								<Card.Content>
									<Text variant='titleMedium' style={styles.habitTitle}>{habit.title}</Text>
									<Text style={styles.habitDescription}>{habit.description}</Text>
									<View style={styles.statsRow}>
										<View style={styles.statBadge}>
											<Text style={styles.statBadgeText}> 🔥 {streak}</Text>
											<Text style={styles.statlabel}>Current</Text>
										</View>
										<View style={styles.statBadgeGold}>
											<Text style={styles.statBadgeText}> 🏆 {bestStreak}</Text>
											<Text style={styles.statlabel}>Best</Text>
										</View>
										<View style={styles.statBadgeGreen}>
											<Text style={styles.statBadgeText}> ✅ {total}</Text>
											<Text style={styles.statlabel}>Current</Text>
										</View>
									</View>
								</Card.Content>
							</Card>
						))}
					</ScrollView>
				)
			}
		</View>
	)
}

const styles = StyleSheet.create({
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyStateText: {
		color: '#666666',
	},
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		padding: 16,
	},
	title: {
		fontWeight: 'bold',
		marginBottom: 16,
	},
	card: {
		marginBottom: 18,
		borderRadius: 18,
		backgroundColor: '#fff',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		borderWidth: 1,
		borderColor: '#f0f0f0',
	},
	firstCard: {
		borderWidth: 2,
		borderColor: '#7c4dff',
	},
	habitTitle: {
		fontWeight: 'bold',
		fontSize: 18,
		marginBottom: 2,
	},
	habitDescription: {
		marginBottom: 8,
		color: '#6c6c80',
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
		marginTop: 8,
	},
	statBadge: {
		backgroundColor: '#fff3e0',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 6,
		alignItems: 'center',
		minWidth: 60,
	},
	statBadgeGold: {
		backgroundColor: '#fffde7',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 6,
		alignItems: 'center',
		minWidth: 60,
	},
	statBadgeGreen: {
		backgroundColor: '#e8f5e9',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 6,
		alignItems: 'center',
		minWidth: 60,
	},
	statBadgeText: {
		fontWeight: 'bold',
		fontSize: 15,
		color: '#22223b',
	},
	statlabel: {
		fontSize: 11,
		color: '#888',
		marginTop: 2,
		fontWeight: '500',
	},
	rankingContainer: {
		marginBottom: 24,
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 16,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	rankingTitle: {
		fontWeight: 'bold',
		fontSize: 18,
		marginBottom: 12,
		color: '#7c4dff',
		letterSpacing: 0.5,
	},
	rankingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
		paddingBottom: 8,
	},
	rankingBadge: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
		backgroundColor: '#e0e0e0',
	},
	badge1: {
		backgroundColor: '#ffd700',
	},
	badge2: {
		backgroundColor: '#c0c0c0',
	},
	badge3: {
		backgroundColor: '#cd7f32',
	},
	rankingBadgeText: {
		fontWeight: 'bold',
		color: '#fff',
		fontSize: 15,
	},
	rankingBadgeHabit: {
		flex: 1,
		fontWeight: '600',
		color: '#333',
		fontSize: 15,
	},
	rankingBadgeStreak: {
		fontWeight: 'bold',
		color: '#7c4dff',
		fontSize: 14,
	},
})
