import { Account, Client } from 'react-native-appwrite'


const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID
const platform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM
export const client = new Client()
    .setEndpoint(`${endpoint}`)
    .setProject(`${projectId}`)
    .setPlatform(`${platform}`)

export const account = new Account(client) 