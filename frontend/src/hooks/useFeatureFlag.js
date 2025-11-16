import { useAuth } from '../context/AuthContext';

const useFeatureFlag = (featureName) => {
    const { user } = useAuth();

    if (!user || !user.feature_flags) {
        return false;
    }

    return user.feature_flags[featureName] === true;
};

export default useFeatureFlag;