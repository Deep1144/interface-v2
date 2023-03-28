import React, { useState, useEffect, useMemo } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import Skeleton from '@material-ui/lab/Skeleton';
import { ArrowForwardIos } from '@material-ui/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEthPrice, useMaticPrice } from 'state/application/hooks';
import { TokensTable, PairTable } from 'components';
import AnalyticsInfo from './AnalyticsInfo';
import AnalyticsLiquidityChart from './AnalyticsLiquidityChart';
import AnalyticsVolumeChart from './AnalyticsVolumeChart';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setAnalyticsLoaded } from 'state/analytics/actions';
import { useActiveWeb3React } from 'hooks';

dayjs.extend(utc);

const AnalyticsOverview: React.FC = () => {
  const { t } = useTranslation();
  const { chainId } = useActiveWeb3React();
  const history = useHistory();
  const [globalData, updateGlobalData] = useState<any>(null);
  const [topTokens, updateTopTokens] = useState<any[] | null>(null);
  const [topPairs, updateTopPairs] = useState<any[] | null>(null);
  const [liquidityChartLoaded, setLiquidityChartLoaded] = useState(false);
  const [volumeChartLoaded, setVolumeChartLoaded] = useState(false);
  const { ethPrice } = useEthPrice();
  const { maticPrice } = useMaticPrice();

  const dispatch = useDispatch();
  const params: any = useParams();
  const version = params && params.version ? params.version : 'total';

  useEffect(() => {
    (async () => {
      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/analytics/global-data/${version}`,
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          errorText || res.statusText || `Failed to get global data ${version}`,
        );
      }

      const data = await res.json();

      if (data.data) {
        updateGlobalData(data.data);
      }
    })();

    (async () => {
      if (version === 'v3') {
        if (maticPrice.price && maticPrice.oneDayPrice) {
          const res = await fetch(
            `${process.env.REACT_APP_LEADERBOARD_APP_URL}/analytics/top-tokens/v3`,
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
              errorText || res.statusText || `Failed to get top tokens`,
            );
          }

          const data = await res.json();

          if (data.data) {
            updateTopTokens(data.data);
          }
        }
      } else if (version === 'v2') {
        if (ethPrice.price && ethPrice.oneDayPrice) {
          const res = await fetch(
            `${process.env.REACT_APP_LEADERBOARD_APP_URL}/analytics/top-tokens/v2`,
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
              errorText || res.statusText || `Failed to get top tokens`,
            );
          }
          const data = await res.json();
          if (data.data) {
            updateTopTokens(data.data);
          }
        }
      } else {
        if (
          maticPrice.price &&
          maticPrice.oneDayPrice &&
          ethPrice.price &&
          ethPrice.oneDayPrice
        ) {
          const res = await fetch(
            `${process.env.REACT_APP_LEADERBOARD_APP_URL}/analytics/top-tokens/total`,
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
              errorText || res.statusText || `Failed to get top tokens`,
            );
          }
          const data = await res.json();
          if (data.data) {
            updateTopTokens(data.data);
          }
        }
      }
    })();

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
  }, [
    ethPrice.price,
    ethPrice.oneDayPrice,
    maticPrice.price,
    maticPrice.oneDayPrice,
    version,
    chainId,
  ]);

  useEffect(() => {
    updateGlobalData(null);
    updateTopPairs(null);
    updateTopTokens(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useEffect(() => {
    if (
      globalData &&
      topTokens &&
      topPairs &&
      liquidityChartLoaded &&
      volumeChartLoaded
    ) {
      dispatch(setAnalyticsLoaded(true));
    } else {
      dispatch(setAnalyticsLoaded(false));
    }
  }, [
    globalData,
    topTokens,
    topPairs,
    dispatch,
    liquidityChartLoaded,
    volumeChartLoaded,
  ]);

  return (
    <Box width='100%' mb={3}>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={12} md={6}>
          <Box className='panel' width={1}>
            <AnalyticsLiquidityChart
              globalData={globalData}
              setDataLoaded={setLiquidityChartLoaded}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box className='analyticsVolumeChart panel'>
            <AnalyticsVolumeChart
              globalData={globalData}
              setDataLoaded={setVolumeChartLoaded}
            />
          </Box>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Box className='panel flex flex-wrap'>
          {globalData ? (
            <AnalyticsInfo data={globalData} />
          ) : (
            <Skeleton width='100%' height={20} />
          )}
        </Box>
      </Box>
      <Box mt={4}>
        <Box className='flex justify-between items-center'>
          <Box className='headingWrapper'>
            <p className='weight-600'>{t('topTokens')}</p>
          </Box>
          <Box
            className='headingWrapper cursor-pointer'
            onClick={() => history.push(`/analytics/${version}/tokens`)}
          >
            <p className='weight-600'>{t('seeAll')}</p>
            <ArrowForwardIos />
          </Box>
        </Box>
      </Box>
      <Box mt={3} className='panel'>
        {topTokens ? (
          <TokensTable
            data={topTokens
              .sort((token1, token2) => {
                return token1.totalLiquidityUSD > token2.totalLiquidityUSD
                  ? -1
                  : 1;
              })
              .slice(0, 10)}
            showPagination={false}
          />
        ) : (
          <Skeleton variant='rect' width='100%' height={150} />
        )}
      </Box>
      <Box mt={4}>
        <Box className='flex items-center justify-between'>
          <Box className='headingWrapper'>
            <p className='weight-600'>{t('topPairs')}</p>
          </Box>
          <Box
            className='headingWrapper cursor-pointer'
            onClick={() => history.push(`/analytics/${version}/pairs`)}
          >
            <p className='weight-600'>{t('seeAll')}</p>
            <ArrowForwardIos />
          </Box>
        </Box>
      </Box>
      <Box mt={3} className='panel'>
        {topPairs ? (
          <PairTable
            data={topPairs
              .sort((pair1, pair2) => {
                const liquidity1 = pair1.trackedReserveUSD
                  ? pair1.trackedReserveUSD
                  : pair1.reserveUSD ?? 0;
                const liquidity2 = pair2.trackedReserveUSD
                  ? pair2.trackedReserveUSD
                  : pair2.reserveUSD ?? 0;
                return liquidity1 > liquidity2 ? -1 : 1;
              })
              .slice(0, 10)}
            showPagination={false}
          />
        ) : (
          <Skeleton variant='rect' width='100%' height={150} />
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsOverview;
