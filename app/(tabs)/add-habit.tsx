import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

const FREQUENCIES = ["daily", "weekly", "monthly"];

type Frequency = (typeof FREQUENCIES)[number]

export default function AddHabitScreen() {
	const [title, setTitle] = useState<string>("")
	const [description, setDescription] = useState<string>("")
	const [frequency, setFrequency] = useState<Frequency>("daily")
	const { user } = useAuth();
	const router = useRouter();
	const [error, setError] = useState<string>("")
	const theme = useTheme()

	const handleSubmit = async () => {
		if (!user) return;

		try {
			await databases.createDocument(
				DATABASE_ID,
				HABITS_COLLECTION_ID,
				ID.unique(),
				{
					user_id: user.$id,
					title,
					description,
					frequency,
					streak_count: 0,
					last_completed: new Date().toISOString(),
					created_at: new Date().toISOString(),
				}
			)
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message)
				return;
			}

			setError("There was an error creating the habit");
		}

		router.back();
	}

	return (
		<View style={styles.container}>
			<View style={styles.input}>
				<TextInput label="Title" onChangeText={setTitle} mode="outlined" value={title} />
				<TextInput label="Description" onChangeText={setDescription} mode="outlined" value={description} />
			</View>
			<View style={styles.buttons}>
				<SegmentedButtons
					value={frequency}
					onValueChange={(value) => setFrequency(value as Frequency)}
					buttons={FREQUENCIES.map((feq) => ({
						value: feq,
						label: feq.charAt(0).toUpperCase() + feq.slice(1)
					}))}
				/>
				<Button
					mode='contained'
					disabled={!title || !description}
					onPress={handleSubmit}
				>
					Add Habbit
				</Button>
			</View>
			{error ? <Text style={{ color: theme.colors.error }}>{String(error)}</Text> : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		gap: 8,
		backgroundColor: '#f5f5f5',
		justifyContent: 'center',
	},
	input: {
		gap: 16,
	},
	buttons: {
		gap: 24,
	}
})