import api from './api';

export interface SubjectStats {
    subject: string;
    attempts: number;
    averageScore: number;
}

export interface WeakTopic {
    topic: string;
    subject: string;
    correctRate: number;
    attempts: number;
}

export interface QuizAttempt {
    id: string;
    studentName: string;
    subject: string;
    score: number;
    totalQuestions: number;
    timestamp: number;
}

export interface TeacherStats {
    totalAttempts: number;
    averageScore: number;
    subjectStats: SubjectStats[];
    weakTopics: WeakTopic[];
    recentAttempts: QuizAttempt[];
}

/**
 * Get teacher dashboard statistics
 */
// Classroom Types
export interface Classroom {
    _id: string;
    title: string;
    subject: string;
    classNumber: number;
    section?: string;
    room?: string;
    gradient: string[];
    teacherId: string;
    students?: any[];
}

export interface CreateClassroomData {
    title: string;
    subject: string;
    classNumber: number;
    section?: string;
    room?: string;
    gradient?: string[];
    autoEnroll?: boolean;
}

// Stats (Mock for now, kept as is)
export const getTeacherStats = async (): Promise<TeacherStats> => {
    // ... (existing mock stats code)
    console.log('[TeacherService] Fetching teacher stats (mock)');
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
        totalAttempts: 156,
        averageScore: 72.5,
        subjectStats: [
            { subject: 'Mathematics', attempts: 45, averageScore: 78.2 },
            { subject: 'Science', attempts: 38, averageScore: 71.5 },
            { subject: 'English', attempts: 42, averageScore: 68.9 },
            { subject: 'History', attempts: 31, averageScore: 75.3 },
        ],
        weakTopics: [
            { topic: 'Algebra', subject: 'Mathematics', correctRate: 45, attempts: 20 },
            { topic: 'Grammar', subject: 'English', correctRate: 52, attempts: 18 },
            { topic: 'Physics', subject: 'Science', correctRate: 58, attempts: 15 },
            { topic: 'World Wars', subject: 'History', correctRate: 61, attempts: 12 },
        ],
        recentAttempts: [],
    };
};

// Classroom API
export const fetchClassrooms = async (): Promise<Classroom[]> => {
    try {
        const response = await api.get('/teacher/classrooms');
        return response.data;
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        throw error;
    }
};

export const createClassroom = async (data: CreateClassroomData): Promise<Classroom> => {
    try {
        const response = await api.post('/teacher/classroom', data);
        return response.data;
    } catch (error) {
        console.error('Error creating classroom:', error);
        throw error;
    }
};

export const deleteClassroom = async (id: string): Promise<void> => {
    try {
        await api.delete(`/teacher/classroom/${id}`);
    } catch (error) {
        console.error('Error deleting classroom:', error);
        throw error;
    }
};

export const fetchClassroom = async (id: string): Promise<Classroom> => {
    try {
        const response = await api.get(`/teacher/classroom/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching classroom:', error);
        throw error;
    }
};

export const addStudentToClassroom = async (classroomId: string, studentEmail: string): Promise<any> => {
    try {
        const response = await api.post('/teacher/classroom/add-student', { classroomId, studentEmail });
        return response.data;
    } catch (error) {
        console.error('Error adding student:', error);
        throw error;
    }
};

export const removeStudentFromClassroom = async (classroomId: string, studentId: string): Promise<void> => {
    try {
        const response = await api.delete(`/teacher/classroom/${classroomId}/student/${studentId}`);
        return response.data;
    } catch (error) {
        console.error('Error removing student:', error);
        throw error;
    }
};
