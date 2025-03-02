const communityInputRules = {
  creatorId: {
    requiredErrorMessage: 'Community creator ID is required'
  },
  name: {
    requiredErrorMessage: 'Community Name is required',
    minLength: {
      value: 2,
      errorMessage: 'Community Name must be at least 2 characters long'
    },
    maxLength: {
      value: 30,
      errorMessage: 'Community Name must not exceed 30 characters'
    },
  },
  description: {
    requiredErrorMessage: 'Community Description is required',
    minLength: {
      value: 10,
      errorMessage: 'Community Description must be at least 10 characters long'
    },
    maxLength: {
      value: 100,
      errorMessage: 'Community Description must not exceed 100 characters'
    },
  },
  access: {
    invalidValueMessage: 'Community access value can only be "public" or "private"'
  },
  rulesTitle: {
    minLength: {
      value: 5,
      errorMessage: 'Community rule title must have at least 5 characters'
    },
    maxLength: {
      value: 20,
      errorMessage: 'Community rule title must not exceed 20 characters'
    },
  },
  rulesDescription: {
    minLength: {
      value: 5,
      errorMessage: 'Community rule description must have at least 5 characters'
    },
    maxLength: {
      value: 100,
      errorMessage: 'Community rule description must not exceed 100 characters'
    },
  }
};

export default communityInputRules;