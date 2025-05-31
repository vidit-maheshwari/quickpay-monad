/**
 * Utility functions for calculating and managing user credibility scores
 */

/**
 * Calculate a user's credibility score based on various factors
 * The score is on a scale of 300-850, similar to a CIBIL/credit score
 * 
 * @param {Object} userData - User transaction and activity data
 * @returns {Object} - Credibility score and component scores
 */
export const calculateCredibilityScore = (userData) => {
  // Default base score
  const baseScore = 300;
  const maxScore = 850;
  
  // If no data is provided, return minimum score
  if (!userData) {
    return {
      totalScore: baseScore,
      components: {
        paymentHistory: 0,
        transactionVolume: 0,
        networkActivity: 0,
        accountAge: 0,
        verificationLevel: 0
      },
      level: 'Poor'
    };
  }
  
  // Extract data from userData
  const {
    transactions = [],
    accountCreationDate = new Date(),
    verificationLevel = 0,
    successfulTransactions = 0
  } = userData;
  
  // Calculate component scores
  
  // 1. Payment History (35% of total score) - based on successful transactions ratio
  const totalTransactions = transactions.length;
  const paymentHistoryRatio = totalTransactions > 0 
    ? successfulTransactions / totalTransactions 
    : 0;
  const paymentHistoryScore = Math.round(paymentHistoryRatio * 100);
  
  // 2. Transaction Volume (30% of total score)
  // Calculate total volume of transactions
  const totalVolume = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  // Score based on logarithmic scale (more volume = higher score, but with diminishing returns)
  const volumeScore = Math.min(100, Math.round(Math.log10(totalVolume + 1) * 20));
  
  // 3. Network Activity (15% of total score)
  // Based on number of unique addresses interacted with
  const uniqueAddresses = new Set(transactions.map(tx => tx.recipient)).size;
  const networkActivityScore = Math.min(100, Math.round(Math.log2(uniqueAddresses + 1) * 15));
  
  // 4. Account Age (10% of total score)
  // Calculate account age in days
  const today = new Date();
  const accountAge = Math.max(1, Math.floor((today - new Date(accountCreationDate)) / (1000 * 60 * 60 * 24)));
  // Score based on logarithmic scale (older accounts get higher scores, but with diminishing returns)
  const accountAgeScore = Math.min(100, Math.round(Math.log10(accountAge) * 30));
  
  // 5. Verification Level (10% of total score)
  // 0 = basic, 1 = email verified, 2 = KYC verified
  const verificationScore = Math.round((verificationLevel / 2) * 100);
  
  // Calculate weighted score
  const weightedScore = (
    (paymentHistoryScore * 0.35) +
    (volumeScore * 0.30) +
    (networkActivityScore * 0.15) +
    (accountAgeScore * 0.10) +
    (verificationScore * 0.10)
  );
  
  // Map to 300-850 range
  const totalScore = Math.round(baseScore + (weightedScore * (maxScore - baseScore) / 100));
  
  // Determine score level
  let level = 'Poor';
  if (totalScore >= 750) level = 'Excellent';
  else if (totalScore >= 700) level = 'Good';
  else if (totalScore >= 650) level = 'Fair';
  else if (totalScore >= 600) level = 'Below Average';
  
  return {
    totalScore,
    components: {
      paymentHistory: paymentHistoryScore,
      transactionVolume: volumeScore,
      networkActivity: networkActivityScore,
      accountAge: accountAgeScore,
      verificationLevel: verificationScore
    },
    level
  };
};

/**
 * Get achievements based on user activity
 * 
 * @param {Object} userData - User transaction and activity data
 * @returns {Array} - List of achievements
 */
export const getUserAchievements = (userData) => {
  if (!userData || !userData.transactions) {
    return [];
  }
  
  const achievements = [];
  const { transactions } = userData;
  
  // First Transaction Achievement
  if (transactions.length > 0) {
    achievements.push({
      id: 'first_transaction',
      title: 'First Transaction',
      description: 'Completed your first QuickPay transaction',
      icon: '🚀',
      date: transactions[0].timestamp
    });
  }
  
  // Transaction Volume Achievements
  const totalVolume = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  
  if (totalVolume >= 10) {
    achievements.push({
      id: 'high_volume',
      title: 'High Volume',
      description: `Transacted over ${totalVolume.toFixed(2)} ETH in total`,
      icon: '💰',
      date: new Date().toISOString()
    });
  }
  
  // Trusted Sender Achievement
  const successfulTransactions = transactions.filter(tx => tx.status === 'completed').length;
  if (successfulTransactions >= 10) {
    achievements.push({
      id: 'trusted_sender',
      title: 'Trusted Sender',
      description: 'Made 10+ successful transactions',
      icon: '🛡️',
      date: new Date().toISOString()
    });
  }
  
  // Reliable Payer Achievement
  const uniqueRecipients = new Set(transactions.map(tx => tx.recipient)).size;
  if (uniqueRecipients >= 5) {
    achievements.push({
      id: 'reliable_payer',
      title: 'Reliable Payer',
      description: 'Never missed a payment request',
      icon: '✅',
      date: new Date().toISOString()
    });
  }
  
  return achievements;
};

/**
 * Get user transaction statistics
 * 
 * @param {Object} userData - User transaction and activity data
 * @returns {Object} - Transaction statistics
 */
export const getTransactionStats = (userData) => {
  if (!userData || !userData.transactions) {
    return {
      totalTransactions: 0,
      totalVolume: 0,
      averageAmount: 0,
      largestTransaction: 0
    };
  }
  
  const { transactions } = userData;
  
  const totalTransactions = transactions.length;
  const totalVolume = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  const averageAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
  const largestTransaction = transactions.reduce((max, tx) => Math.max(max, parseFloat(tx.amount) || 0), 0);
  
  return {
    totalTransactions,
    totalVolume,
    averageAmount,
    largestTransaction
  };
};
