export type Proposition = {
  id: string;
  scope: string;
  scopeDetails: {
    characteristics: {
      eventToken: string;
    };
    activity: {
      id: string;
      matchedSurfaces: string[];
    };
    correlationID: string;
    decisionProvider: string;
  };
};

