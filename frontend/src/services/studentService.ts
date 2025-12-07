import api from './api';

export interface ClassroomItem {
    id: string;
    type: 'chapter' | 'quiz';
    title: string;
    subtitle: string;
    description: string;
    fullContent?: string;
    teacher: string;
    date: string;
    icon: string;
    questions?: any[];
}

export const fetchClassroomContent = async (): Promise<ClassroomItem[]> => {
    try {
        const response = await api.get('/student/classroom');
        return response.data;
    } catch (error) {
        console.error('Error fetching classroom content:', error);
        throw error;
    }
};
