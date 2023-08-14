import React from 'react';
import { Box } from '@material-ui/core';
import { Frown } from 'react-feather';
import { useTranslation } from 'react-i18next';
import Loader from '../../components/Loader';
import { GlobalConst, GlobalData } from 'constants/index';
import UnipilotFarmCard from './UnipilotFarmCard';
import { getTokenFromAddress } from 'utils';
import { useActiveWeb3React } from 'hooks';
import { useSelectedTokenList } from 'state/lists/hooks';
import { useUSDCPricesFromAddresses } from 'utils/useUSDCPrice';
import { formatUnits } from 'ethers/lib/utils';
import {
  useUnipilotFarmData,
  useUnipilotFarms,
} from 'hooks/v3/useUnipilotFarms';

const UnipilotFarmsPage: React.FC<{
  farmFilter: string;
  search: string;
  sortBy: string;
  sortDesc: boolean;
}> = ({ farmFilter, search, sortBy, sortDesc }) => {
  const { t } = useTranslation();
  const { chainId } = useActiveWeb3React();
  const tokenMap = useSelectedTokenList();
  const sortMultiplier = sortDesc ? -1 : 1;
  const { v3FarmSortBy, v3FarmFilter } = GlobalConst.utils;

  const {
    loading: unipilotFarmsLoading,
    data: unipilotFarmsArray,
  } = useUnipilotFarms(chainId);
  const unipilotFarms = unipilotFarmsArray ?? [];

  const {
    loading: unipilotFarmDataLoading,
    data: unipilotFarmData,
  } = useUnipilotFarmData(
    unipilotFarms.map((farm: any) => farm.id),
    chainId,
  );

  const rewardTokenAddresses = unipilotFarms.reduce(
    (memo: string[], farm: any) => {
      if (
        !memo.includes(farm.rewardTokenA.id) &&
        Number(formatUnits(farm.totalRewardPaidA, farm.rewardTokenA.decimals)) >
          0
      ) {
        memo.push(farm.rewardTokenA.id);
      }
      if (
        !memo.includes(farm.rewardTokenB.id) &&
        Number(formatUnits(farm.totalRewardPaidB, farm.rewardTokenB.decimals)) >
          0
      ) {
        memo.push(farm.rewardTokenB.id);
      }
      return memo;
    },
    [],
  );

  const rewardsWithUSDPrice = useUSDCPricesFromAddresses(rewardTokenAddresses);

  const filteredFarms = unipilotFarms
    .map((item: any) => {
      if (chainId) {
        const token0 = getTokenFromAddress(
          item.token0.id,
          chainId,
          tokenMap,
          [],
        );
        const token1 = getTokenFromAddress(
          item.token1.id,
          chainId,
          tokenMap,
          [],
        );
        return { ...item, token0, token1 };
      }
      return { ...item, token0: undefined, token1: undefined };
    })
    .filter((item: any) => {
      const searchCondition =
        (item.token0 &&
          item.token0.symbol &&
          item.token0.symbol.toLowerCase().includes(search.toLowerCase())) ||
        (item.token0 &&
          item.token0.address.toLowerCase().includes(search.toLowerCase())) ||
        (item.token1 &&
          item.token1.symbol &&
          item.token1.symbol.toLowerCase().includes(search.toLowerCase())) ||
        (item.token1 &&
          item.token1.address.toLowerCase().includes(search.toLowerCase())) ||
        item.title.toLowerCase().includes(search.toLowerCase());
      const blueChipCondition =
        !!GlobalData.blueChips[chainId].find(
          (token) =>
            item.token0 &&
            token.address.toLowerCase() === item.token0.address.toLowerCase(),
        ) &&
        !!GlobalData.blueChips[chainId].find(
          (token) =>
            item.token1 &&
            token.address.toLowerCase() === item.token1.address.toLowerCase(),
        );
      const stableCoinCondition =
        !!GlobalData.stableCoins[chainId].find(
          (token) =>
            item.token0 &&
            token.address.toLowerCase() === item.token0.address.toLowerCase(),
        ) &&
        !!GlobalData.stableCoins[chainId].find(
          (token) =>
            item.token1 &&
            token.address.toLowerCase() === item.token1.address.toLowerCase(),
        );

      const stablePair0 = GlobalData.stablePairs[chainId].find(
        (tokens) =>
          !!tokens.find(
            (token) =>
              item.token0 &&
              token.address.toLowerCase() === item.token0.address.toLowerCase(),
          ),
      );
      const stablePair1 = GlobalData.stablePairs[chainId].find(
        (tokens) =>
          !!tokens.find(
            (token) =>
              item.token1 &&
              token.address.toLowerCase() === item.token1.address.toLowerCase(),
          ),
      );
      const stableLPCondition =
        item.token0 &&
        item.token1 &&
        ((stablePair0 &&
          stablePair0.find(
            (token) =>
              token.address.toLowerCase() === item.token1.address.toLowerCase(),
          )) ||
          (stablePair1 &&
            stablePair1.find(
              (token) =>
                token.address.toLowerCase() ===
                item.token0.address.toLowerCase(),
            )));

      return (
        searchCondition &&
        (farmFilter === v3FarmFilter.blueChip
          ? blueChipCondition
          : farmFilter === v3FarmFilter.stableCoin
          ? stableCoinCondition
          : farmFilter === v3FarmFilter.stableLP
          ? stableLPCondition
          : farmFilter === v3FarmFilter.otherLP
          ? !blueChipCondition && !stableCoinCondition && !stableLPCondition
          : true)
      );
    })
    .sort((farm0: any, farm1: any) => {
      if (sortBy === v3FarmSortBy.pool) {
        const farm0Title =
          (farm0.token0?.symbol ?? '') +
          (farm0.token1?.symbol ?? '') +
          farm0.title;
        const farm1Title =
          (farm1.token0?.symbol ?? '') +
          (farm1.token1?.symbol ?? '') +
          farm1.title;
        return farm0Title > farm1Title ? sortMultiplier : -1 * sortMultiplier;
      } else if (sortBy === v3FarmSortBy.tvl) {
        // const tvl0 =
        //   gammaReward0 && gammaReward0['stakedAmountUSD']
        //     ? Number(gammaReward0['stakedAmountUSD'])
        //     : 0;
        // const tvl1 =
        //   gammaReward1 && gammaReward1['stakedAmountUSD']
        //     ? Number(gammaReward1['stakedAmountUSD'])
        //     : 0;
        // return tvl0 > tvl1 ? sortMultiplier : -1 * sortMultiplier;
      } else if (sortBy === v3FarmSortBy.rewards) {
        const farm0RewardA = Number(
          formatUnits(farm0.totalRewardPaidA, farm0.rewardTokenA.decimals),
        );
        const farm0RewardB = Number(
          formatUnits(farm0.totalRewardPaidB, farm0.rewardTokenB.decimals),
        );
        const farm0RewardTokenAUSD = rewardsWithUSDPrice?.find(
          (item) =>
            item.address.toLowerCase() === farm0.rewardTokenA.id.toLowerCase(),
        );
        const farm0RewardTokenBUSD = rewardsWithUSDPrice?.find(
          (item) =>
            item.address.toLowerCase() === farm0.rewardTokenA.id.toLowerCase(),
        );
        const farm0RewardUSD =
          farm0RewardA * (farm0RewardTokenAUSD?.price ?? 0) +
          farm0RewardB * (farm0RewardTokenBUSD?.price ?? 0);

        const farm1RewardA = Number(
          formatUnits(farm1.totalRewardPaidA, farm1.rewardTokenA.decimals),
        );
        const farm1RewardB = Number(
          formatUnits(farm1.totalRewardPaidB, farm1.rewardTokenB.decimals),
        );
        const farm1RewardTokenAUSD = rewardsWithUSDPrice?.find(
          (item) =>
            item.address.toLowerCase() === farm1.rewardTokenA.id.toLowerCase(),
        );
        const farm1RewardTokenBUSD = rewardsWithUSDPrice?.find(
          (item) =>
            item.address.toLowerCase() === farm1.rewardTokenA.id.toLowerCase(),
        );
        const farm1RewardUSD =
          farm1RewardA * (farm1RewardTokenAUSD?.price ?? 0) +
          farm1RewardB * (farm1RewardTokenBUSD?.price ?? 0);

        return farm0RewardUSD > farm1RewardUSD
          ? sortMultiplier
          : -1 * sortMultiplier;
      } else if (sortBy === v3FarmSortBy.apr) {
        const farm0Data =
          unipilotFarmData && farm0 && farm0.id
            ? unipilotFarmData[farm0.id.toLowerCase()]
            : undefined;
        const farm0Apr = farm0Data ? Number(farm0Data['total']) : 0;
        const farm1Data =
          unipilotFarmData && farm1 && farm1.id
            ? unipilotFarmData[farm1.id.toLowerCase()]
            : undefined;
        const farm1Apr = farm1Data ? Number(farm1Data['total']) : 0;
        return farm0Apr > farm1Apr ? sortMultiplier : -1 * sortMultiplier;
      }
      return 1;
    });

  return (
    <Box px={2} py={3}>
      {unipilotFarmsLoading || unipilotFarmDataLoading ? (
        <div className='flex justify-center' style={{ padding: '16px 0' }}>
          <Loader stroke='white' size='1.5rem' />
        </div>
      ) : filteredFarms.length === 0 ? (
        <div
          className='flex flex-col items-center'
          style={{ padding: '16px 0' }}
        >
          <Frown size={'2rem'} stroke={'white'} />
          <p style={{ marginTop: 12 }}>{t('noGammaFarms')}</p>
        </div>
      ) : !unipilotFarmsLoading && filteredFarms.length > 0 && chainId ? (
        <Box>
          {filteredFarms.map((farm: any) => {
            return (
              <Box mb={2} key={farm.id}>
                <UnipilotFarmCard
                  token0={farm.token0}
                  token1={farm.token1}
                  data={farm}
                  farmData={
                    unipilotFarmData && farm.id
                      ? unipilotFarmData[farm.id.toLowerCase()]
                      : undefined
                  }
                />
              </Box>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};

export default UnipilotFarmsPage;
