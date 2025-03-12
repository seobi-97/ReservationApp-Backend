// 정규식 유틸리티
const regex = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[가-힣a-zA-Z0-9]+$/;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const validateEmail = (email) => {
        return emailRegex.test(email);
    };

    const validateName = (name) => {
        return nameRegex.test(name);
    };

    const validatePassword = (password) => {
        return passwordRegex.test(password);
    };

    return { validateEmail, validateName, validatePassword };
};

export default regex;
