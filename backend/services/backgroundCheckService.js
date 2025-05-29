const logger = require('../utills/logger');

const initiateBackgroundCheck = async (applicantId, applicationDetails) => {
    logger.info(`Initiating background check for applicant: ${applicantId}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    const mockStatus = Math.random() > 0.3 ? 'completed_clear' : 'completed_issues';
    logger.info(`Mock background check for ${applicantId} completed with status: ${mockStatus}`);
    return { checkId: `mock_bg_${Date.now()}`, status: mockStatus };
};

const getBackgroundCheckStatus = async (checkId) => {
    logger.info(`Fetching status for background check: ${checkId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: checkId, status: 'completed_clear', reportUrl: `http://example.com/report/${checkId}` };
};

module.exports = {
    initiateBackgroundCheck,
    getBackgroundCheckStatus,
};