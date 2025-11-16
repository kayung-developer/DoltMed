import useFeatureFlag from '../../hooks/useFeatureFlag';

const Feature = ({ name, children }) => {
    const isEnabled = useFeatureFlag(name);

    if (!isEnabled) {
        return null;
    }

    return <>{children}</>;
};

export default Feature;