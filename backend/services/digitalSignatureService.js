const logger = require('../utills/logger');
const { v4: uuidv4 } = require('uuid');

const requestSignature = async (documentId, signerEmail, leaseDetails) => {
    logger.info(`Requesting digital signature for document ${documentId} from ${signerEmail}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockEnvelopeId = `mock_sig_${uuidv4()}`;
    logger.info(`Mock signature request sent. Envelope ID: ${mockEnvelopeId}`);
    return { envelopeId: mockEnvelopeId, status: 'sent' };
};

const getSignatureStatus = async (envelopeId) => {
    logger.info(`Fetching status for signature envelope: ${envelopeId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const isSigned = Math.random() > 0.5;
    return {
        envelopeId: envelopeId,
        status: isSigned ? 'completed' : 'sent',
        signedAt: isSigned ? new Date().toISOString() : null,
    };
};

module.exports = {
    requestSignature,
    getSignatureStatus,
};