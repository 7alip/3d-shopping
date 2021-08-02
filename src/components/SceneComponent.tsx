import { Suspense, useCallback, useRef, useState } from "react";
import {
  Box,
  HStack,
  Button,
  Flex,
  DarkMode,
  VStack,
  Heading,
  Text,
  Image,
  Icon,
  Grid,
  IconButton,
} from "@chakra-ui/react";
import {
  Scene as ReactScene,
  Engine as ReactEngine,
  Model,
} from "react-babylonjs";
import {
  AbstractMesh,
  Nullable,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import {
  FaCartPlus,
  FaCheckCircle,
  FaChevronLeft,
  FaStar,
} from "react-icons/fa";
import { FiInfo, FiPlusCircle } from "react-icons/fi";
import { useMemo } from "react";

const REMOTE_PUBLIC_URL = "https://arspar.s3.eu-central-1.amazonaws.com/";
// const LOCALE_PUBLIC_URL = "https:/arspar.ngrok.io";

type ModelDataType = {
  id: string;
  text: string;
  variants: {
    id: string;
    name: string;
    price: number;
    image: string;
    isSelected: boolean;
  }[];
};

const MODEL_DATA: ModelDataType[] = [
  {
    id: "stand",
    text: "Stand",
    variants: [
      {
        id: "default",
        name: "Default",
        price: 300,
        image: "/stand__default.png",
        isSelected: true,
      },
    ],
  },
  {
    id: "seat",
    text: "Seat",
    variants: [
      {
        id: "default",
        name: "Default",
        price: 220,
        image: "/seat__default.png",
        isSelected: true,
      },
      {
        id: "ring-chair",
        name: "Ring Chair",
        price: 320,
        image: "/seat__ring-chair.png",
        isSelected: false,
      },
    ],
  },
  {
    id: "beanbag",
    text: "Beanbag",
    variants: [
      {
        id: "default",
        name: "Default",
        price: 105,
        image: "/beanbag__default.png",
        isSelected: true,
      },
      {
        id: "short-stool",
        name: "Short Stool",
        price: 140,
        image: "/beanbag__short-stool.png",
        isSelected: false,
      },
      {
        id: "long-stool",
        name: "Long Stool",
        price: 155,
        image: "/beanbag__long-stool.png",
        isSelected: false,
      },
    ],
  },
];

export const SceneComponent = () => {
  const [mainParts, setMainParts] = useState<Nullable<TransformNode[]>>(null);
  const [modelData, setModelData] = useState<ModelDataType[]>(MODEL_DATA);
  const [globalScene, setGlobalScene] = useState<Nullable<Scene>>(null);
  const [subParts, setSubParts] = useState<Nullable<TransformNode[]>>(null);
  const [bg, setBg] = useState<string>("linear(to-br, red.600, #d8242d)");
  const [showSelected, setShowSelected] = useState<boolean>(false);

  const [activeNodeName, setActiveNodeName] = useState<Nullable<string>>(null);
  const [activeVariant, setActiveVariant] =
    useState<Nullable<string>>("default");

  const highlightLayerEL = useRef<any>(null);

  const selectActiveTransformNode = (name: string) => {
    setActiveNodeName(name);
    setShowSelected(false);

    globalScene?.meshes.forEach((m) => {
      if (m.name.match(`${name}__${activeVariant}`)) {
        highlightLayerEL.current.addMesh(m, Color3.White());
      } else {
        highlightLayerEL.current.removeMesh(m);
      }
    });
  };

  const activateTransformNodes = (nodes: TransformNode[]) =>
    nodes.forEach((node) => {
      if (
        node.name.includes("__") &&
        node.name.match(`^(?!.*(${activeNodeName || ""}__${activeVariant}))`)
      ) {
        node.setEnabled(false);
      }
    });

  const onSelectVariant = (variant: string) => {
    setActiveVariant(variant);

    const changedModel = modelData.map((data) => {
      if (data.id === activeNodeName) {
        const changedVariants = data.variants.map((v) => {
          if (v.id === variant) {
            return {
              ...v,
              isSelected: true,
            };
          } else {
            return {
              ...v,
              isSelected: false,
            };
          }
        });

        return { ...data, variants: changedVariants };
      }
      return data;
    });

    setModelData(changedModel);

    subParts?.forEach((part) => {
      if (part.name.includes(`${activeNodeName}__`)) {
        if (!part.name.includes(`__${variant}`)) {
          part.setEnabled(false);
        }
        if (part.name === `${activeNodeName}__${variant}`) {
          part.setEnabled(true);
        }
      }
    });
  };

  const onLoaded = (scene: Scene) => {
    setGlobalScene(scene);
    const mainTransformNodes = scene.transformNodes.filter((tn) =>
      tn.name.match("^(?!.*(__|Camera))")
    );
    console.log(
      `meshes.map(m => m.name)`,
      scene.meshes.map((m) => m.name)
    );

    const subTransformNodes = scene.transformNodes.filter((tn) =>
      tn.name.match("^(?!.*(Camera))")
    );

    setMainParts(mainTransformNodes);
    setSubParts(subTransformNodes);

    activateTransformNodes(subTransformNodes);
    setShowSelected(true);
  };

  const clickedMesh = useCallback((mesh: AbstractMesh, scene: Scene) => {
    const [meshTNodeName, variant] = mesh.name.split("__");

    scene.meshes.forEach((m) => {
      if (m.name.match(`${meshTNodeName}__${variant}`)) {
        highlightLayerEL.current.addMesh(m, Color3.White());
      } else {
        highlightLayerEL.current.removeMesh(m);
      }
    });

    console.log(`mesh`, mesh);

    selectActiveTransformNode(meshTNodeName);
    setActiveVariant(variant);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPrice = useMemo(
    () =>
      modelData.reduce(
        (acc, curr) =>
          acc +
          curr.variants
            .filter((v) => v.isSelected)
            .reduce((a, b) => a + b.price, 0),
        0
      ),
    [modelData]
  );

  console.log(`price`, totalPrice)

  return (
    <Grid w="100vw" h="100vh" overflow="hidden" gridTemplateColumns="1fr 400px">
      <Box pos="relative" bgGradient={bg}>
        <ReactEngine
          canvasStyle={{ width: "100%", height: "100%", outline: "none" }}
          antialias
          adaptToDeviceRatio
          canvasId="arspar-canvas"
        >
          <ReactScene
            onDataLoadedObservable={onLoaded}
            onMeshPicked={clickedMesh}
            clearColor={new Color4(0, 0, 0, 0)}
          >
            <arcRotateCamera
              name="camera1"
              alpha={Math.PI / 4}
              beta={Math.PI / 3}
              radius={8.0}
              target={Vector3.Zero()}
              wheelPrecision={20}
            />
            <hemisphericLight
              name="light1"
              intensity={1}
              direction={Vector3.Up()}
            />
            <pointLight name="light2" intensity={2} position={Vector3.Up()} />
            <highlightLayer name="hl" ref={highlightLayerEL} />
            <Suspense fallback={null}>
              <Model
                attachToMeshesByName={["s"]}
                name="test2"
                rootUrl={`${REMOTE_PUBLIC_URL}`}
                sceneFilename="full_furniture_3c81b5eed1.glb"
                scaleToDimension={3.0}
              />
            </Suspense>
          </ReactScene>
        </ReactEngine>
        <HStack pos="absolute" bottom={8} left={8}>
          {mainParts?.map(({ name }, i) => (
            <DarkMode key={i}>
              <Button
                onClick={() => selectActiveTransformNode(name)}
                variant="outline"
                borderWidth={2}
                borderColor="whiteAlpha.900"
                textTransform="uppercase"
              >
                {name}
              </Button>
            </DarkMode>
          ))}
          <Box
            borderWidth={2}
            borderColor="white"
            boxSize={10}
            borderRadius="full"
            onClick={() => setBg("linear(to-br, red.600, #d8242d)")}
            bgGradient="linear(to-br, red.600, #d8242d)"
          />
          <Box
            borderWidth={2}
            borderColor="white"
            boxSize={10}
            borderRadius="full"
            onClick={() => setBg("linear(to-br, gray.700, black)")}
            bgGradient="linear(to-br, gray.700, black)"
          />
          <Box
            borderWidth={2}
            borderColor="white"
            boxSize={10}
            borderRadius="full"
            onClick={() => setBg("linear(to-br, purple.600, orange.500)")}
            bgGradient="linear(to-br, purple.600, orange.500)"
          />
          <Box
            borderWidth={2}
            borderColor="white"
            boxSize={10}
            borderRadius="full"
            onClick={() => setBg("linear(to-br, green.500, blue.700)")}
            bgGradient="linear(to-br, green.500, blue.700)"
          />
        </HStack>
        <Flex
          color="white"
          justify="space-between"
          pos="absolute"
          top={8}
          left={8}
          right={8}
        >
          <Box textAlign="center">
            <Heading size="4xl">TR160</Heading>
            <Text fontWeight="bold" fontSize="2em">
              Build your own
            </Text>
          </Box>
          <Box>
            <HStack mb={4}>
              <Icon as={FaStar} />
              <Icon as={FaStar} />
              <Icon as={FaStar} />
              <Icon as={FaStar} />
              <Icon as={FaStar} />
              <Text>3 Reviews</Text>
            </HStack>
            <DarkMode>
              <Button
                size="lg"
                isFullWidth
                borderWidth={2}
                borderColor="whiteAlpha.800"
                variant="outline"
                rightIcon={<FaCartPlus fontSize="1.2em" />}
              >
                Add to chart
              </Button>
            </DarkMode>
          </Box>
        </Flex>
      </Box>
      <Flex
        as="aside"
        flexDir="column"
        flexBasis={400}
        maxW={400}
        h="100vh"
        bg="white"
        justifyContent="space-between"
      >
        <VStack align="stretch" spacing={4} overflowY="auto" p={4} flex={1}>
          {showSelected ? (
            <>
              <Heading
                textTransform="capitalize"
                mt={6}
                textAlign="left"
                fontWeight="bold"
                flexShrink={0}
                size="lg"
              >
                Current Configuration
              </Heading>
              {modelData.map((item) => (
                <Box key={item.id}>
                  {item.variants
                    .filter((variant) => variant.isSelected)
                    .map((variant) => (
                      <Flex
                        pos="relative"
                        key={variant.name}
                        p={4}
                        bgGradient="linear(to-b, gray.200, gray.300)"
                        minH={250}
                        align="center"
                        w="full"
                        cursor='pointer'
                        onClick={() => selectActiveTransformNode(item.id)}
                      >
                        <Flex
                          flexDir="column"
                          justify="space-between"
                          align="start"
                          pos="absolute"
                          left={4}
                          top={4}
                          bottom={4}
                          w="70%"
                        >
                          <Button
                            size="sm"
                            variant="unstyled"
                            rightIcon={<FiInfo />}
                            display="flex"
                            alignItems="center"
                          >
                            Show more information
                          </Button>
                          <Box>
                            <Text fontSize="1.2em">{item.text}</Text>
                            <Text fontSize="1.2em" textTransform="uppercase">
                              {variant.name}
                            </Text>
                            <Text mb={4} fontSize="1.2em" fontWeight="bold">
                              ${variant.price.toFixed(2)}
                            </Text>
                            {!showSelected &&
                              (activeVariant !== variant.id ? (
                                <Button
                                  onClick={() => onSelectVariant(variant.id)}
                                  variant="unstyled"
                                  leftIcon={<FiPlusCircle fontSize="1.2em" />}
                                  display="flex"
                                  alignItems="center"
                                >
                                  Add to collection
                                </Button>
                              ) : (
                                <HStack py={2} color="#d8242d">
                                  <Icon fontSize="1.2em" as={FaCheckCircle} />
                                  <Text>Included in configuration</Text>
                                </HStack>
                              ))}
                          </Box>
                        </Flex>
                        <Image
                          ml="auto"
                          objectFit="contain"
                          boxSize={32}
                          src={variant.image}
                        />
                      </Flex>
                    ))}
                </Box>
              ))}
            </>
          ) : (
            activeNodeName && (
              <>
                <HStack>
                  <IconButton
                    aria-label="x"
                    onClick={() => setShowSelected(true)}
                    icon={<FaChevronLeft />}
                  />
                  <Heading
                    textTransform="capitalize"
                    mt={6}
                    textAlign="left"
                    fontWeight="bold"
                    flexShrink={0}
                    px={4}
                  >
                    {activeNodeName}
                  </Heading>
                </HStack>
                {modelData
                  .find((item) => item.id === activeNodeName)
                  ?.variants.map((variant) => (
                    <Flex
                      pos="relative"
                      key={variant.name}
                      my={2}
                      p={4}
                      bgGradient="linear(to-b, gray.200, gray.300)"
                      minH={250}
                      align="center"
                      w="full"
                    >
                      <Flex
                        flexDir="column"
                        justify="space-between"
                        align="start"
                        pos="absolute"
                        left={4}
                        top={4}
                        bottom={4}
                        w="70%"
                      >
                        <Button
                          size="sm"
                          variant="unstyled"
                          rightIcon={<FiInfo />}
                          display="flex"
                          alignItems="center"
                        >
                          Show more information
                        </Button>
                        <Box>
                          <Text fontSize="1.2em" textTransform="uppercase">
                            {variant.name}
                          </Text>
                          <Text mb={4} fontSize="1.2em" fontWeight="bold">
                            ${variant.price.toFixed(2)}
                          </Text>
                          {activeVariant !== variant.id ? (
                            <Button
                              onClick={() => onSelectVariant(variant.id)}
                              variant="unstyled"
                              leftIcon={<FiPlusCircle fontSize="1.2em" />}
                              display="flex"
                              alignItems="center"
                            >
                              Add to collection
                            </Button>
                          ) : (
                            <HStack py={2} color="#d8242d">
                              <Icon fontSize="1.2em" as={FaCheckCircle} />
                              <Text>Included in configuration</Text>
                            </HStack>
                          )}
                        </Box>
                      </Flex>
                      <Image
                        ml="auto"
                        objectFit="contain"
                        boxSize={32}
                        src={variant.image}
                      />
                    </Flex>
                  ))}
              </>
            )
          )}
        </VStack>
        <VStack
          flexShrink={0}
          bg="black"
          w="full"
          align="start"
          p={4}
          spacing={8}
        >
          <Box color="white" fontWeight="bold">
            <Text fontSize="3em">${totalPrice.toFixed(2)}</Text>
            <Text fontSize="1.2em">Current price</Text>
          </Box>
          <DarkMode>
            <Button
              isFullWidth
              fontWeight="bold"
              variant="outline"
              borderWidth={2}
              borderColor="whiteAlpha.900"
              size="lg"
            >
              Pre-order
            </Button>
          </DarkMode>
        </VStack>
      </Flex>
    </Grid>
  );
};
