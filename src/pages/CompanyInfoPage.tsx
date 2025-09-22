import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyInfoForm from '../components/CompanyInfoForm';

const CompanyInfoPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/employer-dashboard');
  };

  const handleCancel = () => {
    navigate('/employer-dashboard');
  };

  return (
    <CompanyInfoForm onComplete={handleComplete} onCancel={handleCancel} />
  );
};

export default CompanyInfoPage;
