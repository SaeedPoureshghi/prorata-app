import abi from "@/contracts/ProRataFactory.json";
import { useEffect, useState } from "react";
import { getContract } from "viem";

const Wallets = (props: Wallets) => {
  const [count, setCount] = useState("Loading...");

  useEffect(() => {
    const contract = getContract({
      address: abi.networks["97"].address as `0x${string}`,
      abi: abi.abi,
      client: props.client,
    });

    const getData = async () => {
      const result = await contract.read.getUserWalletsCount();
      setCount(result as string);
    };

    getData();
  });

  return <div>{count}</div>;
};

export default Wallets;
