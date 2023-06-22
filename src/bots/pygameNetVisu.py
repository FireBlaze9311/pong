import pygame
import numpy as np


def getActivationColor(x: float) -> tuple[int, int, int]:
    '''
    Gets the activation color.

        Args:
            x (float): Value between -1 and 1

        Returns:
            tuple[int, int, int]: Interpolated color, pink for negative and green for positve.
    '''
    assert x >= -1 and x <= 1, "Value has to be between -1 and 1"
    if x < 0:
        return (int(-x * 205 + 50), int(x * 50 + 50), int(-x * 130 + 50))
    else:
        return (int(-x * 50 + 50), int(x * 205 + 50), int(-50 * x + 50))


def drawLayer(surface: pygame.Surface, biases: np.ndarray, height: int,
              neuron_radius: int = 40,
              offset: tuple[int, int] = (0, 0)):
    '''
    Draws a layer of neurons.

    Args:
        surface (pygame.Surface): Pygame surface. 
        biases (np.ndarray): Layer biases.
        height (int): Available height for layer.

        Optional:
            neuron_radius (int): Neuron radius.
            offset (tuple[int, int]): Offset coordinates.
    '''
    n = len(biases)
    m = abs(max(np.min(biases), np.max(biases), key=abs))
    circle_spacing = height // (n + 1)
    for i in range(n):
        y = circle_spacing * (i + 1) + offset[1]
        color = getActivationColor(0 if m == 0 else biases[i]/m)
        pygame.draw.circle(surface, pygame.Color(*color),
                           (offset[0] + neuron_radius, y), neuron_radius)


def drawConnections(surface: pygame.Surface, weights: np.ndarray, spacing_l1: int, spacing_l2: int, l_margin: int,
                    offset: tuple[int, int] = (0, 0),
                    thickness: int = 3,
                    neuron_radius: int = 40):
    '''
    Draws connections between neurons of two layers.

    Args:
        surface (pygame.Surface): Pygame surface. 
        weights (np.ndarray): Network weights.
        spacing_l1 (int): Distance between each neuron in layer 1.
        spacing_l2 (int): Distance between each neuron in layer 2.
        l_margin (int): Margin between layers.

        Optional:
            offset (tuple[int, int]): Offset coordinates.
            height (int): Available height for layer.
            neuron_radius (int): Radius of a neuron.
    '''
    m = abs(max(np.min(weights), np.max(weights), key=abs))
    for i in range(weights.shape[1]):
        yL1 = spacing_l1 * (i + 1) + offset[1]
        for j in range(weights.shape[0]):
            yL2 = spacing_l2 * (j + 1) + offset[1]
            pygame.draw.line(surface, getActivationColor(
                weights[j][i]/m), (offset[0] + neuron_radius, yL1), (offset[0] + l_margin + neuron_radius, yL2), thickness)


def drawNet(surface: pygame.Surface, weights: list[np.ndarray], biases: list[np.ndarray],
            offset: tuple[int, int] = (0, 0),
            net_margin_bottom: int = 30,
            neuron_radius: int = 40,
            layer_margin: int = 150,
            weight_thickness: int = 3):
    '''
    Draws a network in pygame surface.

    Args:
        surface (pygame.Surface): Pygame surface. 
        weights (list[np.ndarray]): List of network weights.
        biases (list[np.ndarray]): List of network biases, zeros for input layer.

        Optional:
            offset (tuple[int, int]): Offset coordinates.
            net_margin_bottom (int): Margin to bottom of surface.
            neuron_radius (int): Radius of a neuron.
            layer_margin (int): Margin between layers.
            weight_thickness (int): Thickness of weight connections.
    '''

    height = surface.get_height() - offset[1] - net_margin_bottom

    # todo: weights, biases shape assertions

    l_margin = neuron_radius * 2 + layer_margin
    # draw connections
    l_offsetX = offset[0]
    for i in range(len(biases)-1):
        spacing1 = height // (len(biases[i]) + 1)
        spacing2 = height // (len(biases[i+1]) + 1)
        drawConnections(surface, weights[i], spacing1, spacing2, l_margin,
                        (l_offsetX, offset[1]), weight_thickness, neuron_radius)
        l_offsetX += l_margin

    l_offsetX = offset[0]
    # draw layers
    for i in range(len(biases)):
        drawLayer(surface, biases[i], height,
                  neuron_radius, (l_offsetX, offset[1]))
        l_offsetX += l_margin
