import React, { useEffect, useState } from 'react';
import { Box } from '@material-ui/core';
import { PairTable } from 'components';
import { getTopPairs, getBulkPairData, getGammaRewards } from 'utils';
import { Skeleton } from '@material-ui/lab';
import { useTranslation } from 'react-i18next';
import { GammaPairs, GlobalConst } from 'constants/index';
import { useEthPrice } from 'state/application/hooks';
import { getTopPairsV3, getPairsAPR, getTopPairsTotal } from 'utils/v3-graph';
import { useDispatch } from 'react-redux';
import { setAnalyticsLoaded } from 'state/analytics/actions';
import { useParams } from 'react-router-dom';
import { useActiveWeb3React } from 'hooks';

const AnalyticsPairs: React.FC = () => {
  const { t } = useTranslation();
  const { chainId } = useActiveWeb3React();
  const [topPairs, updateTopPairs] = useState<any[] | null>(null);
  const { ethPrice } = useEthPrice();

  const dispatch = useDispatch();

  const params: any = useParams();
  const version = params && params.version ? params.version : 'total';

  useEffect(() => {
    (async () => {
      if (version === 'v3') {
        const res = await fetch(
          `${process.env.REACT_APP_LEADERBOARD_APP_URL}/analytics/top-pairs/v3`,
        );
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            errorText || res.statusText || `Failed to get top pairs v3`,
          );
        }
        const pairsData = await res.json();
        if (pairsData.data) {
          updateTopPairs(pairsData.data);
        }
      } else if (version === 'v2') {
        if (ethPrice.price) {
          const res = await fetch(
            `${process.env.REACT_APP_LEADERBOARD_APP_URL}/analytics/top-pairs/v2`,
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
              errorText || res.statusText || `Failed to get top pairs v2`,
            );
          }
          const pairsData = await res.json();
          if (pairsData.data) {
            updateTopPairs(pairsData.data);
          }
        }
      } else {
        const res = await fetch(
          `${process.env.REACT_APP_LEADERBOARD_APP_URL}/analytics/top-pairs/total`,
        );
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            errorText || res.statusText || `Failed to get top pairs total`,
          );
        }
        const pairsData = await res.json();
        if (pairsData.data) {
          updateTopPairs(pairsData.data);
        }
      }
    })();
  }, [ethPrice.price, version, chainId]);

  useEffect(() => {
    updateTopPairs(null);
  }, [version]);

  useEffect(() => {
    if (topPairs) {
      dispatch(setAnalyticsLoaded(true));
    } else {
      dispatch(setAnalyticsLoaded(false));
    }
  }, [topPairs, dispatch]);

  return (
    <Box width='100%' mb={3}>
      <p>{t('allPairs')}</p>
      <Box mt={4} className='panel'>
        {topPairs ? (
          <PairTable data={topPairs} />
        ) : (
          <Skeleton variant='rect' width='100%' height={150} />
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsPairs;
