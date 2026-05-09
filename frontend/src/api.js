// API functions for authentication
import config from './config';

export async function login({ email, password }) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, token: data.token, user: data.user };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function register(userData) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, token: data.token, user: data.user };
    } else {
      return { success: false, error: data.message || 'Registration failed' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// Class Posts API functions
export async function getTeacherPosts(token) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/class-posts/my-posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, posts: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch posts' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function createClassPost(token, postData) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/class-posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, post: data };
    } else {
      return { success: false, error: data.message || 'Failed to create post' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function updateClassPost(token, postId, postData) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/class-posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, post: data };
    } else {
      return { success: false, error: data.message || 'Failed to update post' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function deleteClassPost(token, postId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/class-posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.message || 'Failed to delete post' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function submitPostForApproval(token, postId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/class-posts/${postId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, post: data.post };
    } else {
      return { success: false, error: data.message || 'Failed to submit post' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// Comments API functions
export async function getCommentsForPost(postId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/comments/post/${postId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, comments: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch comments' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function createComment(token, commentData) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, comment: data };
    } else {
      return { success: false, error: data.message || 'Failed to create comment' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function updateComment(token, commentId, commentData) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, comment: data };
    } else {
      return { success: false, error: data.message || 'Failed to update comment' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function deleteComment(token, commentId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.message || 'Failed to delete comment' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getTeacherComments(token) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/comments/my-posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, comments: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch comments' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// Streams and Subjects API functions
export async function getStreams() {
  try {
    console.log("Fetching from:", `${config.API_BASE_URL}/streams`);
    const response = await fetch(`${config.API_BASE_URL}/streams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Streams response status:", response.status);
    console.log("Streams response headers:", response.headers);
    
    const responseText = await response.text();
    console.log("Streams raw response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Response text:", responseText.substring(0, 200));
      return { success: false, error: `Invalid JSON response: ${e.message}` };
    }

    if (response.ok) {
      return { success: true, streams: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch streams' };
    }
  } catch (error) {
    console.error("Error in getStreams:", error);
    return { success: false, error: `Network error: ${error.message}` };
  }
}

export async function getSubjects(streamId = null) {
  try {
    const url = streamId
      ? `${config.API_BASE_URL}/subjects?streamId=${streamId}`
      : `${config.API_BASE_URL}/subjects`;
    
    console.log("Fetching from:", url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Subjects response status:", response.status);
    console.log("Subjects response headers:", response.headers);
    
    const responseText = await response.text();
    console.log("Subjects raw response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Response text:", responseText.substring(0, 200));
      return { success: false, error: `Invalid JSON response: ${e.message}` };
    }

    if (response.ok) {
      return { success: true, subjects: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch subjects' };
    }
  } catch (error) {
    console.error("Error in getSubjects:", error);
    return { success: false, error: `Network error: ${error.message}` };
  }
}

// Learning Flow API functions
export async function getSubjectLessons(token, subjectId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/lessons/by-subject/${subjectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, lessons: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch lessons' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getLessonFull(token, lessonId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/lessons/${lessonId}/full`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, lesson: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch lesson' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getStudentSubjects(token) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/student/subjects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, data: data.data };
    }

    return { success: false, error: data.message || 'Failed to fetch student subjects' };
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getStudentLessons(token, subjectId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/student/lessons/${subjectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, lessons: data.data };
    }

    return { success: false, error: data.message || 'Failed to fetch student lessons' };
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getStudentMcqsByLesson(token, lessonId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/student/mcqs/lesson/${lessonId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, mcqs: data.data };
    }

    return { success: false, error: data.message || 'Failed to fetch MCQ questions' };
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function submitStudentMcqs(token, payload) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/student/mcqs/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, result: data.data };
    }

    return { success: false, error: data.message || 'Failed to submit MCQ answers' };
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function sendStudentChatMessage(token, payload) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/student/chatbot/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, data: data.data };
    }

    return { success: false, error: data.message || 'Failed to send chat message' };
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getQuestionsForLesson(token, lessonId, questionType = null) {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('lessonId', lessonId);
    if (questionType) queryParams.append('type', questionType);

    const response = await fetch(`${config.API_BASE_URL}/assessments/questions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, questions: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch questions' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function submitMCQAnswer(token, lessonId, questionId, selectedOptionIndex) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/assessments/mcq/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lessonId,
        questionId,
        selectedOptionIndex,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, result: data };
    } else {
      return { success: false, error: data.message || 'Failed to submit answer' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function submitStructuredAnswer(token, lessonId, submissions) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/assessments/submit-descriptive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lessonId,
        submissions,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, attemptId: data.attemptId };
    } else {
      return { success: false, error: data.message || 'Failed to submit answer' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// Student API functions for approved posts
export async function getApprovedPosts(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.subject) queryParams.append('subject', filters.subject);
    if (filters.grade) queryParams.append('grade', filters.grade);
    if (filters.location) queryParams.append('location', filters.location);

    const response = await fetch(`${config.API_BASE_URL}/class-posts/approved?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, posts: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch posts' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getApprovedPostById(postId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/class-posts/approved/${postId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, post: data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch post' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

async function getPublicJson(path, fallbackMessage) {
  try {
    const response = await fetch(`${config.API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, error: data.message || fallbackMessage };
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function getLandingSummary() {
  const result = await getPublicJson('/public/landing-summary', 'Failed to fetch landing summary');
  if (!result.success) return result;
  return { success: true, summary: result.data };
}

export async function getFeaturedSubjects(limit = 6) {
  const result = await getPublicJson(
    `/public/featured-subjects?limit=${encodeURIComponent(limit)}`,
    'Failed to fetch featured subjects'
  );
  if (!result.success) return result;
  return { success: true, subjects: result.data };
}

export async function getApprovedClassPosts(limit = 3) {
  const result = await getPublicJson(
    `/public/approved-class-posts?limit=${encodeURIComponent(limit)}`,
    'Failed to fetch approved class posts'
  );
  if (!result.success) return result;
  return { success: true, posts: result.data };
}
