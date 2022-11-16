import { ChainId, Token } from '@uniswap/sdk';
import { formatUnits } from 'ethers/lib/utils';
import { useFarmingSubgraph } from 'hooks/useIncentiveSubgraph';
import { useEffect, useState } from 'react';
import { useMaticPrice } from 'state/application/hooks';
import { getTokenInfoV3 } from 'utils/v3-graph';

export function useV3DistributedRewards(chainId: ChainId) {
  const {
    fetchEternalFarms: { fetchEternalFarmsFn, eternalFarms },
  } = useFarmingSubgraph() || {};
  useEffect(() => {
    fetchEternalFarmsFn(true);
  }, []);
  const allRewardTokenAddresses = eternalFarms
    ? eternalFarms
        .map(({ rewardToken }) => rewardToken.id)
        .concat(eternalFarms.map(({ bonusRewardToken }) => bonusRewardToken.id))
    : [];
  const rewardTokenAddressStr = allRewardTokenAddresses
    .filter(
      (address, index) =>
        allRewardTokenAddresses.findIndex(
          (tokenAddress) =>
            address.toLowerCase() === tokenAddress.toLowerCase(),
        ) === index,
    )
    .join(',');
  const [rewardTokenPrices, setRewardTokenPrices] = useState<
    { address: string; price: number }[] | undefined
  >(undefined);

  const { maticPrice } = useMaticPrice();

  useEffect(() => {
    (async () => {
      if (chainId) {
        const tokenAddresses = rewardTokenAddressStr.split(',');
        const tokenPrices = await Promise.all(
          tokenAddresses.map(async (tokenAddress) => {
            if (
              maticPrice.price === undefined ||
              maticPrice.oneDayPrice === undefined
            )
              return { address: tokenAddress, price: 0 };
            const tokenInfo = await getTokenInfoV3(
              maticPrice.price,
              maticPrice.oneDayPrice,
              tokenAddress,
              chainId,
            );
            const tokenData =
              tokenInfo && tokenInfo.length > 0 ? tokenInfo[0] : tokenInfo;
            return {
              address: tokenAddress,
              price: tokenData ? Number(tokenData.priceUSD) : 0,
            };
          }),
        );
        setRewardTokenPrices(tokenPrices);
      }
    })();
  }, [
    rewardTokenAddressStr,
    chainId,
    maticPrice.price,
    maticPrice.oneDayPrice,
  ]);

  const totalRewardsUSD = eternalFarms
    ? eternalFarms.reduce((total, farm, ind) => {
        const farmRewardRate =
          Number(
            formatUnits(farm.rewardRate, Number(farm.rewardToken.decimals)),
          ) *
          3600 *
          24;
        const farmBonusRewardRate =
          Number(
            formatUnits(
              farm.bonusRewardRate,
              Number(farm.bonusRewardToken.decimals),
            ),
          ) *
          3600 *
          24;
        const rewardTokenPrice = rewardTokenPrices
          ? rewardTokenPrices.find(
              (item) =>
                item.address.toLowerCase() ===
                farm.rewardToken.id.toLowerCase(),
            )?.price ?? 0
          : 0;
        const bonusRewardTokenPrice = rewardTokenPrices
          ? rewardTokenPrices.find(
              (item) =>
                item.address.toLowerCase() ===
                farm.bonusRewardToken.id.toLowerCase(),
            )?.price ?? 0
          : 0;
        const totalUSD =
          total +
          farmRewardRate * rewardTokenPrice +
          farmBonusRewardRate * bonusRewardTokenPrice;
        return totalUSD;
      }, 0)
    : undefined;

  return totalRewardsUSD;
}
