import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('알림을 가져오는 중 오류 발생:', error);
      alert('알림을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('알림 읽음 처리 중 오류 발생:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), { isRead: true })
      );
      
      await Promise.all(updatePromises);
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('모든 알림 읽음 처리 중 오류 발생:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return '📝';
      case 'application_status':
        return '📊';
      case 'message':
        return '💬';
      case 'review':
        return '⭐';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'bg-blue-50 border-blue-200';
      case 'application_status':
        return 'bg-green-50 border-green-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      case 'review':
        return 'bg-yellow-50 border-yellow-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800">알림</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {unreadCount}개 새 알림
                </span>
              )}
            </div>
            <div className="flex gap-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  모두 읽음 처리
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                notification.isRead ? 'opacity-75' : ''
              } ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {notification.status && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(notification.status)}`}>
                          {notification.status === 'accepted' ? '승인' : 
                           notification.status === 'rejected' ? '거절' : '검토중'}
                        </span>
                      )}
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{notification.message}</p>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {notification.createdAt.toDate().toLocaleString()}
                    </p>
                    
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          읽음 처리
                        </button>
                      )}
                      
                      {notification.type === 'application_status' && notification.applicationId && (
                        <button
                          onClick={() => navigate(`/application-detail/${notification.applicationId}`)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          지원서 보기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">알림이 없습니다</h3>
            <p className="text-gray-500">새로운 알림이 도착하면 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 