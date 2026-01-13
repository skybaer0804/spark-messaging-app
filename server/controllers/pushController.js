const PushSubscription = require('../models/PushSubscription');

exports.subscribe = async (req, res) => {
  try {
    const { subscription, deviceId } = req.body;
    const userId = req.user.id;

    if (!subscription || !deviceId) {
      return res.status(400).json({ message: 'Subscription and deviceId are required' });
    }

    // Upsert subscription for the specific device
    await PushSubscription.findOneAndUpdate(
      { userId, deviceId },
      { 
        subscription, 
        isActive: true, 
        updatedAt: Date.now() 
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save subscription', error: error.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user.id;

    if (deviceId) {
      // Deactivate for specific device
      await PushSubscription.findOneAndUpdate(
        { userId, deviceId },
        { isActive: false, updatedAt: Date.now() }
      );
    } else {
      // Deactivate all for the user if no deviceId provided
      await PushSubscription.updateMany(
        { userId },
        { isActive: false, updatedAt: Date.now() }
      );
    }

    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unsubscribe', error: error.message });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { deviceId } = req.query;
    const userId = req.user.id;

    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const subscription = await PushSubscription.findOne({ userId, deviceId, isActive: true });
    res.status(200).json({ isSubscribed: !!subscription });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check status', error: error.message });
  }
};
